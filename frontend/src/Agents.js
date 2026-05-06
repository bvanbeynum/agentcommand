import React, { useState, useEffect } from 'react';
import MarkdownViewer from './MarkdownViewer.js';

const Agents = () => {
	const [agentRoster, setAgentRoster] = useState([]);
	const [selectedAgent, setSelectedAgent] = useState(null);
	const [selectedAgentData, setSelectedAgentData] = useState(null);
	const [expandedTaskIndex, setExpandedTaskIndex] = useState(null);
	const [expandedLogIndex, setExpandedLogIndex] = useState(null);
	const [selectedArtifact, setSelectedArtifact] = useState(null);
	
	const [showInstructionsModal, setShowInstructionsModal] = useState(false);
	const [showToolsModal, setShowToolsModal] = useState(false);
	const [editInstructions, setEditInstructions] = useState('');
	const [isEditingInstructions, setIsEditingInstructions] = useState(false);
	const [activeTools, setActiveTools] = useState([]);
	const [chatInput, setChatInput] = useState('');

	const availableTools = [
		'writeFile', 'runCommand', 'readProjectFile', 'addProjectArtifact', 
		'readProjectArtifact', 'assignTask', 'askClarifyingQuestions'
	];
	
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
					setEditInstructions(json.data.instructions);
					setActiveTools(json.data.tools || []);
				}
			} catch (err) {
				console.error('Failed to fetch details:', err);
			}
		};

		fetchDetails();
		const interval = setInterval(fetchDetails, 5000);
		return () => clearInterval(interval);
	}, [selectedAgent]);

	const handleSaveAgent = async (updateData) => {
		try {
			const res = await fetch(`/api/agents/${selectedAgent}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(updateData)
			});
			const json = await res.json();
			if (json.status === 200) {
				setSelectedAgentData(prev => ({ ...prev, ...updateData }));
			}
		} catch (err) {
			console.error('Failed to save agent updates:', err);
		}
	};

	const handleChatSubmit = async (e) => {
		e.preventDefault();
		if (!chatInput.trim() || !selectedAgentData) return;

		const activeSessionStatuses = ['user_turn', 'agent_turn', 'active'];
		const activeSession = selectedAgentData.sessions?.find(s => activeSessionStatuses.includes(s.status));
		const newMessage = { role: 'user', content: chatInput, timestamp: new Date() };

		try {
			if (!activeSession) {
				const res = await fetch('/api/sessions', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						assignedAgentId: selectedAgent,
						status: 'agent_turn',
						messages: [newMessage]
					})
				});
				if (res.ok) {
					setChatInput('');
					const resDetails = await fetch(`/api/agents/${selectedAgent}`);
					const jsonDetails = await resDetails.json();
					if (jsonDetails.status === 200) setSelectedAgentData(jsonDetails.data);
				}
			} else {
				if (activeSession.status !== 'user_turn') return; // Double check safety
				const updatedMessages = [...activeSession.messages, newMessage];
				const res = await fetch(`/api/sessions/${activeSession.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						messages: updatedMessages,
						status: 'agent_turn'
					})
				});
				if (res.ok) {
					setChatInput('');
					setSelectedAgentData(prev => ({
						...prev,
						sessions: prev.sessions.map(s => 
							s.id === activeSession.id ? { ...s, messages: updatedMessages, status: 'agent_turn' } : s
						)
					}));
				}
			}
		} catch (err) {
			console.error('Failed to send chat message:', err);
		}
	};

	// Separate effect to reset expanded states on agent change
	useEffect(() => {
		setExpandedTaskIndex(null);
		setExpandedLogIndex(null);
		setChatInput('');
	}, [selectedAgent]);

	const getIcon = (name) => {
		const n = name?.toLowerCase() || '';
		if (n.includes('architect')) return 'architecture';
		if (n.includes('developer') || n.includes('node')) return 'code';
		if (n.includes('designer')) return 'brush';
		if (n.includes('analyst')) return 'analytics';
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
							<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '20px' }}>{getIcon(agent.name)}</span>
							<div>
								<div className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface)' }}>{agent.name}</div>
								<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)', lineHeight: 1 }}>ID: {agent.id.slice(-6)}</div>
							</div>
						</div>
						<div className="status-pip" style={{ backgroundColor: agent.status === 'online' ? 'var(--primary-cyan)' : 'var(--outline)' }}></div>
					</button>
				))}
			</aside>

			{/* Drill-down View */}
			<div className="agent-drill-down">
				<div className="portal-btn-container">
					<div className="portal-btn" onClick={() => setShowInstructionsModal(true)}>
						<span className="material-symbols-outlined">description</span>
						<span className="label">Agent<br/>Instructions</span>
					</div>
					<div className="portal-btn" onClick={() => setShowToolsModal(true)}>
						<span className="material-symbols-outlined">construction</span>
						<span className="label">Tool<br/>Configuration</span>
					</div>
					<div style={{ marginLeft: 'auto', textAlign: 'right' }}>
						<h1 className="headline-lg uppercase" style={{ margin: 0, fontSize: '32px', color: 'var(--primary-cyan)' }}>{selectedAgentData.name}</h1>
						<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>ID: {selectedAgentData.id}</div>
						<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)', marginTop: '4px' }}>PROJECT: {selectedAgentData.project}</div>
					</div>
				</div>

				{/* Chat Session Terminal */}
				{(() => {
					const activeSessionStatuses = ['user_turn', 'agent_turn', 'active'];
					const activeSession = selectedAgentData.sessions?.find(s => activeSessionStatuses.includes(s.status));
					const canChat = !activeSession || activeSession.status === 'user_turn';
					const statusLabel = activeSession ? (activeSession.status === 'user_turn' ? 'YOUR TURN' : 'AGENT PROCESSING') : 'READY';

					return (
						<section className="chat-terminal-container bento-card" style={{ padding: 0, marginBottom: '24px' }}>
							<div className="chat-terminal-header">
								<div className="flex-center-gap-8">
									<span className="material-symbols-outlined text-primary-cyan" style={{ fontSize: '16px' }}>forum</span>
									<span className="label-caps" style={{ fontSize: '10px' }}>ACTIVE CHAT SESSION :: {statusLabel}</span>
								</div>
								<div className={`status-pip ${activeSession?.status === 'user_turn' ? 'bg-primary-cyan' : 'bg-alert-amber'} pulse`}></div>
							</div>
							<div className="chat-log-stream mono-data">
								{activeSession?.messages.map((msg, i) => (
									<div key={i} className={`chat-entry ${msg.role === 'user' ? 'chat-entry-user' : 'chat-entry-agent'}`}>
										<div className="chat-entry-header">
											<span className="uppercase" style={{ color: msg.role === 'user' ? 'var(--primary-cyan)' : 'var(--alert-amber)' }}>
												{msg.role === 'user' ? 'USER' : selectedAgentData.name}
											</span>
											<span style={{ opacity: 0.5 }}>— {new Date(msg.timestamp || Date.now()).toLocaleTimeString()}</span>
										</div>
										<div className="chat-entry-content">{msg.content}</div>
									</div>
								))}
								{!activeSession && (
									<div className="flex-center" style={{ height: '100%', opacity: 0.3 }}>
										<span className="label-caps">START TYPING TO BEGIN A SESSION</span>
									</div>
								)}
							</div>
							<form className="chat-input-container" onSubmit={handleChatSubmit}>
								<input 
									type="text" 
									className="chat-input" 
									placeholder={canChat ? "Type a message to start or continue the chat..." : "Waiting for agent to respond..."}
									value={chatInput}
									onChange={(e) => setChatInput(e.target.value)}
									disabled={!canChat}
								/>
								<button type="submit" className="chat-send-btn" disabled={!chatInput.trim() || !canChat}>
									<span className="material-symbols-outlined">send</span>
								</button>
							</form>
						</section>
					);
				})()}

				<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--gutter)', marginBottom: '24px' }}>
					{/* Session History */}
					<section className="bento-card">
						<h2 className="label-caps flex-center-gap-8" style={{ color: 'var(--on-surface-variant)', marginBottom: '16px' }}>
							<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>history_edu</span> SESSION HISTORY
						</h2>
						<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
							{selectedAgentData.sessions?.filter(s => !['user_turn', 'agent_turn', 'active'].includes(s.status)).map((s, i) => (
								<li key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: i < selectedAgentData.sessions.length - 1 ? '1px solid var(--outline-variant)' : 'none', paddingBottom: '8px' }}>
									<div className="flex-column">
										<span className="mono-data" style={{ fontSize: '12px' }}>{s.summary || 'Planning Session'}</span>
										<span className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>{new Date(s.created).toLocaleDateString()}</span>
									</div>
									<span className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>{s.status.toUpperCase()}</span>
								</li>
							))}
							{(!selectedAgentData.sessions || selectedAgentData.sessions.filter(s => s.status !== 'active').length === 0) && <div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)' }}>No historical sessions.</div>}
						</ul>
					</section>

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

				{/* Work Log Terminal */}
				<section className="terminal-container" style={{ gridColumn: 'span 12' }}>
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
									<div className="flex-gap-8" style={{ 
										backgroundColor: expandedLogIndex === i ? (isError ? 'rgba(255, 84, 73, 0.1)' : 'rgba(0, 174, 239, 0.1)') : 'transparent', 
										padding: '2px 4px', 
										borderRadius: '2px',
										alignItems: 'flex-start'
									}}>
										<span style={{ color: 'var(--outline)', flexShrink: 0 }}>[{new Date(log.created).toLocaleTimeString()}]</span>
										{log.projectName && (
											<span style={{ 
												color: 'var(--primary-cyan)', 
												fontSize: '10px', 
												fontWeight: 'bold', 
												border: '1px solid rgba(0, 174, 239, 0.3)',
												padding: '0 4px',
												borderRadius: '2px',
												backgroundColor: 'rgba(0, 174, 239, 0.05)',
												flexShrink: 0,
												alignSelf: 'flex-start',
												marginTop: '2px'
											}}>
												{log.projectName}
											</span>
										)}
										<span style={{ 
											color: isError ? '#ff5449' : '#e6edf3', 
											fontWeight: isError ? '600' : '400',
											wordBreak: 'break-word',
											flex: 1
										}}>{log.message}</span>
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

				{/* Instructions Modal */}
				{showInstructionsModal && (
					<div className="modal-overlay" onClick={() => setShowInstructionsModal(false)}>
						<div className="modal-content bento-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
							<header className="modal-header">
								<div>
									<h2 className="label-caps" style={{ margin: 0 }}>AGENT INSTRUCTIONS</h2>
									<div className="mono-data" style={{ fontSize: '10px', color: 'var(--outline)', marginTop: '4px' }}>
										NAME: {selectedAgentData.name}
									</div>
								</div>
								<div style={{ display: 'flex', gap: '8px' }}>
									<button 
										className={`btn-telemetry-filter${!isEditingInstructions ? '-active' : ''} mono-data`}
										onClick={() => setIsEditingInstructions(false)}
									>VIEW</button>
									<button 
										className={`btn-telemetry-filter${isEditingInstructions ? '-active' : ''} mono-data`}
										onClick={() => setIsEditingInstructions(true)}
									>EDIT</button>
								</div>
								<button className="modal-close-btn" onClick={() => setShowInstructionsModal(false)}>
									<span className="material-symbols-outlined">close</span>
								</button>
							</header>
							<div className="modal-body scrollable-y" style={{ minHeight: '400px' }}>
								{isEditingInstructions ? (
									<textarea 
										className="mono-data"
										style={{ 
											width: '100%', 
											height: '100%', 
											minHeight: '400px',
											backgroundColor: 'var(--surface-container-lowest)',
											border: '1px solid var(--outline-variant)',
											padding: '16px',
											resize: 'none',
											boxSizing: 'border-box'
										}}
										value={editInstructions}
										onChange={(e) => setEditInstructions(e.target.value)}
										placeholder="Enter markdown instructions here..."
									/>
								) : (
									<MarkdownViewer content={selectedAgentData.instructions || 'No instructions provided.'} />
								)}
							</div>
							<footer className="modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
								<button className="btn-telemetry-filter mono-data" onClick={() => setShowInstructionsModal(false)}>CANCEL</button>
								<button 
									className="btn-telemetry-filter-active mono-data" 
									onClick={() => {
										handleSaveAgent({ instructions: editInstructions });
										setShowInstructionsModal(false);
									}}
								>SAVE CHANGES</button>
							</footer>
						</div>
					</div>
				)}

				{/* Tools Modal */}
				{showToolsModal && (
					<div className="modal-overlay" onClick={() => setShowToolsModal(false)}>
						<div className="modal-content bento-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
							<header className="modal-header">
								<h2 className="label-caps" style={{ margin: 0 }}>TOOL CONFIGURATION</h2>
								<button className="modal-close-btn" onClick={() => setShowToolsModal(false)}>
									<span className="material-symbols-outlined">close</span>
								</button>
							</header>
							<div className="modal-body">
								<div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
									{availableTools.map(tool => (
										<label key={tool} className="flex-center-gap-8" style={{ cursor: 'pointer', padding: '8px', backgroundColor: 'var(--surface-container-low)', borderRadius: '4px' }}>
											<input 
												type="checkbox" 
												checked={activeTools.includes(tool)}
												onChange={(e) => {
													if (e.target.checked) {
														setActiveTools([...activeTools, tool]);
													} else {
														setActiveTools(activeTools.filter(t => t !== tool));
													}
												}}
											/>
											<span className="mono-data" style={{ fontSize: '12px' }}>{tool}</span>
										</label>
									))}
								</div>
							</div>
							<footer className="modal-footer" style={{ justifyContent: 'flex-end', gap: '12px' }}>
								<button className="btn-telemetry-filter mono-data" onClick={() => setShowToolsModal(false)}>CANCEL</button>
								<button 
									className="btn-telemetry-filter-active mono-data" 
									onClick={() => {
										handleSaveAgent({ tools: activeTools });
										setShowToolsModal(false);
									}}
								>APPLY TOOLS</button>
							</footer>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};

export default Agents;
