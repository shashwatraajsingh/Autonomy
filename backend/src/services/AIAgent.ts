import { PrismaClient, Policy } from '@prisma/client';
import { EventEmitter } from 'events';
import OpenAI from 'openai';
import { PolicyEnforcer, TransactionRequest } from './PolicyEnforcer';
import { WalletManager } from './WalletManager';

interface AgentConfig {
    id: string;
    name: string;
    walletAddress: string;
    policy: Policy;
    prisma: PrismaClient;
    policyEnforcer: PolicyEnforcer;
    walletManager: WalletManager;
}

interface AgentTask {
    type: 'research' | 'trade' | 'payment';
    service: string;
    amount?: number;
    data?: any;
}

export class AIAgent extends EventEmitter {
    private config: AgentConfig;
    private openai: OpenAI;
    private running: boolean = false;
    private taskQueue: AgentTask[] = [];

    constructor(config: AgentConfig) {
        super();
        this.config = config;
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY || 'demo-key'
        });
    }

    async start(): Promise<void> {
        this.running = true;
        this.log('info', `Agent ${this.config.name} started`);
        this.emit('started');
    }

    async stop(): Promise<void> {
        this.running = false;
        this.taskQueue = [];
        this.log('info', `Agent ${this.config.name} stopped`);
        this.emit('stopped');
    }

    async emergencyStop(): Promise<void> {
        this.running = false;
        this.taskQueue = [];
        this.log('warn', `EMERGENCY STOP: Agent ${this.config.name} frozen`);
        this.emit('frozen');
    }

    async executeTask(task: AgentTask): Promise<{ success: boolean; result?: any; error?: string }> {
        if (!this.running) {
            return { success: false, error: 'Agent is not running' };
        }

        this.log('info', `Executing task: ${task.type} to ${task.service}`);

        // If task requires payment, validate against policy
        if (task.amount && task.amount > 0) {
            const txRequest: TransactionRequest = {
                agentId: this.config.id,
                service: task.service,
                amount: task.amount,
                type: task.type
            };

            const validation = await this.config.policyEnforcer.validateTransaction(txRequest);

            // Record transaction
            const tx = await this.config.prisma.transaction.create({
                data: {
                    agentId: this.config.id,
                    userId: (await this.config.prisma.agent.findUnique({ where: { id: this.config.id } }))!.userId,
                    service: task.service,
                    amount: task.amount,
                    status: validation.approved ? 'approved' : 'blocked',
                    reason: validation.reason,
                    metadata: { taskType: task.type }
                }
            });

            this.emit('transaction', tx);

            if (!validation.approved) {
                this.log('warn', `Transaction blocked: ${validation.reason}`);
                return { success: false, error: validation.reason };
            }

            // Execute actual payment
            try {
                const txHash = await this.config.walletManager.sendPayment(
                    this.config.walletAddress,
                    task.service,
                    task.amount
                );

                // Update transaction with hash
                await this.config.prisma.transaction.update({
                    where: { id: tx.id },
                    data: { txHash }
                });

                this.log('info', `Payment successful: ${txHash}`);
            } catch (error: any) {
                this.log('error', `Payment failed: ${error.message}`);
                return { success: false, error: error.message };
            }
        }

        // Execute the AI task
        try {
            const result = await this.executeAITask(task);
            this.log('info', `Task completed: ${task.type}`);
            return { success: true, result };
        } catch (error: any) {
            this.log('error', `Task failed: ${error.message}`);
            return { success: false, error: error.message };
        }
    }

    private async executeAITask(task: AgentTask): Promise<any> {
        // Demo: Simulate AI task execution
        // In production, this would call actual AI APIs

        const taskPrompts: Record<string, string> = {
            research: `Research the following topic and provide a brief summary: ${task.data?.topic || 'general AI news'}`,
            trade: `Analyze market conditions for: ${task.data?.symbol || 'ETH/USDC'}`,
            payment: `Process payment to ${task.service} for amount ${task.amount}`
        };

        // For demo, return mock response
        // In production, call OpenAI API
        if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'demo-key') {
            const response = await this.openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [
                    { role: 'system', content: 'You are an autonomous AI agent managing financial tasks.' },
                    { role: 'user', content: taskPrompts[task.type] || 'Execute task' }
                ],
                max_tokens: 200
            });
            return response.choices[0].message.content;
        }

        // Demo mode response
        return {
            status: 'completed',
            taskType: task.type,
            service: task.service,
            timestamp: new Date().toISOString(),
            result: `Demo: ${task.type} task executed successfully`
        };
    }

    private log(level: 'info' | 'warn' | 'error', message: string, metadata?: any) {
        this.emit('log', { level, message, metadata, timestamp: new Date().toISOString() });
    }

    getStatus() {
        return {
            id: this.config.id,
            name: this.config.name,
            running: this.running,
            walletAddress: this.config.walletAddress,
            queuedTasks: this.taskQueue.length
        };
    }
}
