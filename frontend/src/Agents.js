import React, { useState, useEffect } from 'react';
import MarkdownViewer from './MarkdownViewer.js';

const Agents = () => {
	const [agentRoster, setAgentRoster] = useState([]);
	const [selectedAgent, setSelectedAgent] = useState(null);
	const [selectedAgentData, setSelectedAgentData] = useState(null);
	const [expandedTaskIndex, setExpandedTaskIndex] = useState(null);
	const [expandedLogIndex, setExpandedLogIndex] = useState(null);
	const [selectedArtifact, setSelectedArtifact] = useState(null);
	
	useEffect(() => {
		const fetchRoster = async () => {
			try {
				const res = await fetch('/api/agents');
				const json = await res.json();
				if (json.status === 200) {
					setAgentRoster(json.data);
					if (json.data.length > 0 && !selectedAgent) {
						setSelectedAgent(json.data[0].id);
					}
				}
			} catch (err) {
				console.error('Failed to fetch agent roster:', err);
			}
		};
		fetchRoster();
	}, []);

	useEffect(() => {
		const fetchDetails = async () => {
			if (!selectedAgent) return;
			try {
				const res = await fetch(`/api/agents/${selectedAgent}`);
				const json = await res.json();
				if (json.status === 200) {
					setSelectedAgentData(json.data);
				}
			} catch (err) {
				console.error('Failed to fetch details:', err);
			}
		};

		fetchDetails();
		const interval = setInterval(fetchDetails, 5000);
		return () => clearInterval(interval);
	}, [selectedAgent]);

	// Separate effect to reset expanded states on agent change
	useEffect(() => {
		setExpandedTaskIndex(null);
		setExpandedLogIndex(null);
	}, [selectedAgent]);

	const getIcon = (role) => {
		const r = role?.toLowerCase() || '';
		if (r.includes('architect')) return 'architecture';
		if (r.includes('developer') || r.includes('node')) return 'code';
		if (r.includes('designer')) return 'brush';
		if (r.includes('analyst')) return 'analytics';
		return 'memory';
	};

	if (!selectedAgentData && agentRoster.length > 0) {
		return (
			<div className="flex-center" style={{ height: '100%', color: 'var(--outline)' }}>
				<div className="mono-data">SYNCHRONIZING WITH NEURAL NODES...</div>
			</div>
		);
	}

	if (agentRoster.length === 0) {
		return (
			<div className="flex-center" style={{ height: '100%', color: 'var(--outline)' }}>
				<div className="mono-data">NO AGENTS DETECTED IN GRID.</div>
			</div>
		);
	}

	return (
		<div className="grid-container" style={{ alignItems: 'start' }}>
			{/* Agent List Sidebar */}
			<aside className="agent-roster-sidebar">
				<h2 className="roster-header uppercase">AGENT ROSTER</h2>
				{agentRoster.map(agent => (
					<button 
						key={agent.id}
						className={`roster-btn ${selectedAgent === agent.id ? 'roster-btn-active' : ''}`}
						onClick={() => setSelectedAgent(agent.id)}
					>
						<div className="flex-center-gap-8">
							<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '20px' }}>{getIcon(agent.id)}</span>
							<div>
								<div className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface)' }}>{agent.id}</div>
								<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)', lineHeight: 1 }}>ROLE: {agent.role}</div>
							</div>
						</div>
						<div className="status-pip" style={{ backgroundColor: agent.status === 'online' ? 'var(--primary-cyan)' : 'var(--outline)' }}></div>
					</button>
				))}
			</aside>

			{/* Drill-down View */}
			<div className="agent-drill-down">
				{/* Agent Header */}
				<header className="agent-header">
					<div>
						<h1 className="headline-lg uppercase" style={{ margin: 0, fontSize: '32px' }}>{selectedAgentData.id}</h1>
						<div className="agent-meta-container">
							<div className="agent-meta-item">
								<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '14px' }}>engineering</span>
								<span className="uppercase">ROLE: {selectedAgentData.role}</span>
							</div>
							<span style={{ color: 'var(--outline-variant)' }}>/</span>
							<div className="agent-meta-item">
								<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '14px' }}>calendar_today</span>
								<span className="uppercase">CREATED: {new Date(selectedAgentData.created).toLocaleDateString()}</span>
							</div>
							<span style={{ color: 'var(--outline-variant)' }}>/</span>
							<div className="agent-meta-item">
								<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '14px' }}>history</span>
								<span className="uppercase">LAST ACTIVITY: {new Date(selectedAgentData.lastActivity).toLocaleTimeString()}</span>
							</div>
							<span style={{ color: 'var(--outline-variant)' }}>/</span>
							<div className="agent-meta-item">
								<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '14px' }}>folder</span>
								<span className="uppercase">PROJECT: {selectedAgentData.project}</span>
							</div>
						</div>
					</div>
				</header>

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gutter)' }}>
					{/* Project History */}
					<section className="bento-card">
						<h2 className="label-caps flex-center-gap-8" style={{ color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
							<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history</span> PROJECT HISTORY
						</h2>
						<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
							{selectedAgentData.history.map((h, i) => (
								<li key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < selectedAgentData.history.length - 1 ? '1px solid var(--outline-variant)' : 'none', paddingBottom: '8px' }}>
									<span className="mono-data" style={{ fontSize: '12px' }}>{h.id}</span>
									<span className="mono-data" style={{ fontSize: '10px', color: h.status === 'COMPLETED' ? 'var(--outline)' : 'var(--primary-cyan)' }}>{h.status}</span>
								</li>
							))}
							{selectedAgentData.history.length === 0 && <div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>No deployment history.</div>}
						</ul>
					</section>

					{/* Artifact Repository */}
					<section className="bento-card">
						<h2 className="label-caps flex-center-gap-8" style={{ color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
							<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>folder_open</span> ARTIFACT REPOSITORY
						</h2>
						<div className="artifact-grid">
							{selectedAgentData.artifacts.map((art, i) => (
								<div 
									key={i} 
									className="artifact-link" 
									style={{ cursor: 'pointer' }}
									onClick={() => setSelectedArtifact(art)}
								>
									<span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--outline)' }}>{art.type === 'image' ? 'image' : 'description'}</span>
									<span className="mono-data" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{art.name}</span>
								</div>
							))}
							{selectedAgentData.artifacts.length === 0 && <div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>No artifacts generated.</div>}
						</div>
					</section>
				</div>

				{/* Artifact Detail Modal */}
				{selectedArtifact && (
					<div className="modal-overlay" onClick={() => setSelectedArtifact(null)}>
						<div className="modal-content bento-card" onClick={e => e.stopPropagation()}>
							<header className="modal-header">
								<div>
									<h2 className="label-caps" style={{ margin: 0 }}>{selectedArtifact.name}</h2>
									<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)', marginTop: '4px' }}>
										UPDATED: {new Date(selectedArtifact.updatedAt).toLocaleString()}
									</div>
								</div>
								<button className="modal-close-btn" onClick={() => setSelectedArtifact(null)}>
									<span className="material-symbols-outlined">close</span>
								</button>
							</header>
							<div className="modal-body scrollable-y">
								<MarkdownViewer content={selectedArtifact.content} />
							</div>
							<footer className="modal-footer">
								<button className="btn-telemetry-filter-active mono-data" onClick={() => setSelectedArtifact(null)}>CLOSE</button>
							</footer>
						</div>
					</div>
				)}

				{/* Recent Task Stream */}
				<section className="bento-card">
					<h2 className="label-caps flex-center-gap-8" style={{ color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
						<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>stream</span> RECENT TASK STREAM
					</h2>
					<div className="timeline-container">
						{selectedAgentData.tasks.map((task, i) => (
							<div 
								key={i} 
								className="timeline-item"
								style={{ display: 'flex', flexDirection: 'column', gap: '4px', position: 'relative', cursor: 'pointer' }}
								onClick={() => setExpandedTaskIndex(expandedTaskIndex === i ? null : i)}
							>
								<div className={`timeline-node ${task.active ? 'timeline-node-active' : ''}`} style={{ top: '4px' }}></div>
								<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
									<span className="mono-data" style={{ fontSize: '10px', backgroundColor: 'var(--surface-variant)', padding: '0 4px', border: '1px solid var(--outline-variant)' }}>{task.id}</span>
									<span className="mono-data" style={{ fontSize: '12px', fontWeight: expandedTaskIndex === i ? '600' : '400' }}>{task.desc}</span>
								</div>
								<span className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>{new Date(task.time).toLocaleString()}</span>
								
								{expandedTaskIndex === i && (
									<div className="task-context-panel mono-data" style={{ 
										marginTop: '8px', 
										padding: '12px', 
										backgroundColor: 'var(--surface-container-low)', 
										border: '1px solid var(--outline-variant)',
										fontSize: '11px',
										color: 'var(--on-surface-variant)',
										whiteSpace: 'pre-wrap',
										wordBreak: 'break-all'
									}}>
										<div style={{ marginBottom: '8px', color: 'var(--primary-cyan)', fontWeight: 'bold' }}>TASK CONTEXT:</div>
										{JSON.stringify(task.payload, null, 2)}
										{task.metadata && (
											<>
												<div style={{ marginTop: '12px', marginBottom: '8px', color: 'var(--primary-cyan)', fontWeight: 'bold' }}>METADATA:</div>
												{JSON.stringify(task.metadata, null, 2)}
											</>
										)}
									</div>
								)}
							</div>
						))}
						{selectedAgentData.tasks.length === 0 && <div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>No tasks in stream.</div>}
					</div>
				</section>

				{/* Work Log Terminal */}
				<section className="terminal-container">
					<div className="terminal-header">
						<span className="mono-data uppercase" style={{ fontSize: '10px', letterSpacing: '0.15em' }}>WORK LOG STREAM :: LIVE</span>
						<div style={{ display: 'flex', gap: '4px' }}>
							<div className="status-pip bg-alert-amber" style={{ opacity: 0.5 }}></div>
							<div className="status-pip bg-primary-cyan" style={{ opacity: 0.8 }}></div>
						</div>
					</div>
					<div className="terminal-log-stream mono-data">
						<div className="flex-gap-8" style={{ marginBottom: '8px' }}>
							<span className="text-primary-cyan">&gt;_</span>
							<span className="terminal-cursor pulse"></span>
						</div>
						{selectedAgentData.recentLogs?.map((log, i) => {
							const isError = log.level === 'error' || log.message?.toLowerCase().includes('error');
							const accentColor = isError ? '#ff5449' : 'var(--primary-cyan)';
							const bgColor = isError ? 'rgba(255, 84, 73, 0.2)' : 'rgba(0, 174, 239, 0.15)';
							const textColor = isError ? '#ffffff' : '#b0deff';

							return (
								<div 
									key={i} 
									className="log-entry-wrapper"
									style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '2px' }}
									onClick={() => setExpandedLogIndex(expandedLogIndex === i ? null : i)}
								>
									<div className="flex-gap-8" style={{ backgroundColor: expandedLogIndex === i ? (isError ? 'rgba(255, 84, 73, 0.1)' : 'rgba(0, 174, 239, 0.1)') : 'transparent', padding: '2px 4px', borderRadius: '2px' }}>
										<span style={{ color: 'var(--outline)' }}>[{new Date(log.created).toLocaleTimeString()}]</span>
										<span style={{ color: isError ? '#ff5449' : '#e6edf3', fontWeight: isError ? '600' : '400' }}>{log.message}</span>
									</div>
									{expandedLogIndex === i && log.context && Object.keys(log.context).length > 0 && (
										<div style={{ 
											marginLeft: '24px', 
											padding: '8px 12px', 
											borderLeft: `2px solid ${accentColor}`, 
											color: textColor, 
											fontSize: '11px',
											backgroundColor: bgColor,
											marginTop: '4px',
											marginBottom: '4px',
											borderRadius: '0 4px 4px 0',
											boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.3)'
										}}>
											<span style={{ color: accentColor, fontWeight: 'bold', marginRight: '8px' }}>[ERROR_CONTEXT]</span>
											{JSON.stringify(log.context, null, 2)}
										</div>
									)}
								</div>
							);
						})}
					</div>
				</section>
			</div>
		</div>
	);
};

export default Agents;
