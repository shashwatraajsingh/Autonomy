import { PrismaClient, Agent, Policy } from '@prisma/client';
import { EventEmitter } from 'events';
import { AIAgent } from './AIAgent';
import { PolicyEnforcer } from './PolicyEnforcer';
import { WalletManager } from './WalletManager';

export class AgentOrchestrator extends EventEmitter {
    private agents: Map<string, AIAgent> = new Map();
    private policyEnforcer: PolicyEnforcer;
    private walletManager: WalletManager;

    constructor(private prisma: PrismaClient) {
        super();
        this.policyEnforcer = new PolicyEnforcer(prisma);
        this.walletManager = new WalletManager();
    }

    async initialize() {
        console.log('🔧 Initializing Agent Orchestrator...');

        // Load all active agents from database
        const dbAgents = await this.prisma.agent.findMany({
            where: { status: 'active' },
            include: { policy: true }
        });

        for (const dbAgent of dbAgents) {
            await this.startAgent(dbAgent.id);
        }

        console.log(`✅ Initialized ${this.agents.size} agents`);
    }

    async startAgent(agentId: string): Promise<void> {
        if (this.agents.has(agentId)) {
            throw new Error(`Agent ${agentId} is already running`);
        }

        const dbAgent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            include: { policy: true }
        });

        if (!dbAgent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        if (dbAgent.status !== 'active') {
            throw new Error(`Agent ${agentId} is not active (status: ${dbAgent.status})`);
        }

        // Create AI agent instance
        const agent = new AIAgent({
            id: dbAgent.id,
            name: dbAgent.name,
            walletAddress: dbAgent.walletAddress,
            policy: dbAgent.policy!,
            prisma: this.prisma,
            policyEnforcer: this.policyEnforcer,
            walletManager: this.walletManager
        });

        // Set up event listeners
        agent.on('transaction', async (tx) => {
            this.emit('transaction', { agentId, transaction: tx });
        });

        agent.on('error', (error) => {
            console.error(`Agent ${agentId} error:`, error);
            this.emit('agentError', { agentId, error });
        });

        agent.on('log', (log) => {
            this.prisma.agentLog.create({
                data: {
                    agentId,
                    level: log.level,
                    message: log.message,
                    metadata: log.metadata
                }
            }).catch(console.error);
        });

        // Start the agent
        await agent.start();
        this.agents.set(agentId, agent);

        console.log(`✅ Started agent: ${dbAgent.name} (${agentId})`);
    }

    async stopAgent(agentId: string): Promise<void> {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} is not running`);
        }

        await agent.stop();
        this.agents.delete(agentId);

        console.log(`🛑 Stopped agent: ${agentId}`);
    }

    async pauseAgent(agentId: string): Promise<void> {
        await this.prisma.agent.update({
            where: { id: agentId },
            data: { status: 'paused' }
        });

        await this.stopAgent(agentId);
    }

    async resumeAgent(agentId: string): Promise<void> {
        await this.prisma.agent.update({
            where: { id: agentId },
            data: { status: 'active' }
        });

        await this.startAgent(agentId);
    }

    async killSwitchAgent(agentId: string): Promise<void> {
        await this.prisma.agent.update({
            where: { id: agentId },
            data: { status: 'frozen' }
        });

        const agent = this.agents.get(agentId);
        if (agent) {
            await agent.emergencyStop();
        }

        await this.stopAgent(agentId);

        console.log(`🚨 KILL SWITCH activated for agent: ${agentId}`);
    }

    getAgent(agentId: string): AIAgent | undefined {
        return this.agents.get(agentId);
    }

    getAllActiveAgents(): AIAgent[] {
        return Array.from(this.agents.values());
    }

    async shutdown(): Promise<void> {
        console.log('🛑 Shutting down all agents...');

        const stopPromises = Array.from(this.agents.keys()).map(id =>
            this.stopAgent(id).catch(console.error)
        );

        await Promise.all(stopPromises);
        console.log('✅ All agents stopped');
    }
}
