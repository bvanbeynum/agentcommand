import React from 'react';

const Overview = ({ data, timeRange, setTimeRange }) => {
	const { stats, throughput } = data;
	
	const formatRelativeTime = (date) => {
		if (!date) return 'Queue';
		const diff = Math.floor((new Date() - new Date(date)) / 1000);
		if (diff < 60) return `${diff}s ago`;
		if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
		return new Date(date).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	};

	return (
		<div className="grid-container">
			{/* Stat Cards */}
			<div className="bento-card stat-card stat-card-span-3">
				<div className="stat-card-header">
					<span className="label-caps">Total Agents</span>
					<span className="material-symbols-outlined stat-card-icon">memory</span>
				</div>
				<div className="mono-data stat-card-value">{stats?.totalAgents || 0}</div>
			</div>
			<div className="bento-card stat-card stat-card-span-3 stat-card-active">
				<div className="stat-card-header">
					<span className="label-caps text-primary-cyan">Active</span>
					<div className="sync-container">
						<div className="status-pip bg-primary-cyan"></div>
						<span className="mono-data sync-text">SYNC</span>
					</div>
				</div>
				<div className="mono-data stat-card-value">{stats?.activeTasks || 0}</div>
			</div>
			<div className="bento-card stat-card stat-card-span-3">
				<div className="stat-card-header">
					<span className="label-caps">Active Projects (24H)</span>
					<span className="material-symbols-outlined stat-card-icon">folder</span>
				</div>
				<div className="mono-data stat-card-value">03</div>
			</div>
			<div className="bento-card stat-card stat-card-span-3">
				<div className="stat-card-header">
					<span className="label-caps text-primary-cyan">Completed Tasks (24H)</span>
					<span className="material-symbols-outlined stat-card-icon-primary">check_circle</span>
				</div>
				<div className="mono-data stat-card-value">{stats?.completed24h || 0}</div>
			</div>

			{/* System Throughput */}
			<div className="bento-card chart-card">
				 <div className="card-header-flex">
						<div className="flex-center-gap-8">
								<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>monitoring</span>
								<span className="label-caps">System Throughput</span>
								<div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'baseline', gap: '8px' }}>
									<span className="label-caps" style={{ fontSize: '10px', color: 'var(--on-surface-variant)' }}>Historical Tasks Completed:</span>
									<span className="mono-data" style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--primary-cyan)' }}>{stats?.historicalTasksCompleted?.toLocaleString() || 0}</span>
								</div>
						</div>
						<div className="flex-gap-8" style={{ marginLeft: '16px' }}>
								{['1H', '12H', '24H', '7D'].map(range => (
									<button 
										key={range}
										onClick={() => setTimeRange(range)}
										className={`mono-data ${timeRange === range ? 'btn-telemetry-filter-active' : 'btn-telemetry-filter'}`}
									>
										{range}
									</button>
								))}
						</div>
				 </div>
				 <div className="histogram-container">
						{throughput && throughput.length > 0 ? (
							throughput.map((count, i) => {
								const max = Math.max(...throughput, 1);
								const h = Math.max((count / max) * 100, 2);
								
								// Calculate time for this bar
								let hours = 24;
								if (timeRange === '1H') hours = 1;
								else if (timeRange === '12H') hours = 12;
								else if (timeRange === '7D') hours = 24 * 7;
								
								const buckets = throughput.length;
								const bucketSizeMs = (hours * 60 * 60 * 1000) / buckets;
								const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);
								const barTime = new Date(startTime.getTime() + i * bucketSizeMs);

								return (
									<div key={i} className="histogram-bar-wrapper group">
										<div className="histogram-bar" style={{ height: `${h}%` }}></div>
										<div className="histogram-tooltip">
											<div className="mono-data" style={{ fontSize: '12px', fontWeight: 'bold' }}>{count} Tasks</div>
											<div className="mono-data" style={{ fontSize: '10px', opacity: 0.8 }}>
												{barTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
												{timeRange === '7D' ? ` ${barTime.toLocaleDateString([], { month: 'short', day: 'numeric' })}` : ''}
											</div>
										</div>
									</div>
								);
							})
						) : (
							[40, 65, 80, 55, 70, 45, 30, 60, 85, 75, 90, 50].map((h, i) => (
								<div key={i} className="histogram-bar" style={{ height: `${h}%`, opacity: 0.3 }}></div>
							))
						)}
				 </div>
				 <div className="histogram-x-axis">
						<span className="mono-data">
							{(() => {
								let hours = 24;
								if (timeRange === '1H') hours = 1;
								else if (timeRange === '12H') hours = 12;
								else if (timeRange === '7D') hours = 24 * 7;
								const t = new Date(Date.now() - hours * 60 * 60 * 1000);
								return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
							})()}
						</span>
						<span className="mono-data">
							{(() => {
								let hours = 24;
								if (timeRange === '1H') hours = 1;
								else if (timeRange === '12H') hours = 12;
								else if (timeRange === '7D') hours = 24 * 7;
								const t = new Date(Date.now() - (hours / 2) * 60 * 60 * 1000);
								return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
							})()}
						</span>
						<span className="mono-data">NOW</span>
				 </div>
			</div>

			{/* Top Agent Activity */}
			<div className="bento-card activity-card">
				<div className="card-header-flex">
					<span className="label-caps">Top Agent Activity</span>
					<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>leaderboard</span>
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
					{stats?.topAgents?.map((agent, i) => (
						<div key={i} className="activity-row">
							<div className="activity-row-label mono-data" style={{ fontSize: '12px' }}>
								<span>{agent.id}</span>
								<span className="text-primary-cyan">{agent.percentage}%</span>
							</div>
							<div className="progress-track">
								<div className="progress-fill" style={{ width: `${agent.percentage}%`, opacity: 1 - (i * 0.15) }}></div>
							</div>
						</div>
					))}
					{(!stats?.topAgents || stats.topAgents.length === 0) && <div className="mono-data" style={{ color: 'var(--outline-variant)', textAlign: 'center' }}>No active telemetry...</div>}
				</div>
			</div>

			{/* Active Project Queue */}
			<div className="bento-card table-card">
				<div className="card-header-flex" style={{ padding: '16px', margin: 0 }}>
					<span className="label-caps">Active Project Queue</span>
					<button className="mono-data" style={{ fontSize: '10px', border: '1px solid var(--outline-variant)', padding: '4px 12px' }}>VIEW ALL</button>
				</div>
				<table className="project-table">
					<thead>
						<tr>
							<th style={{ width: '40px', textAlign: 'center' }}>STS</th>
							<th>PROJECT ID</th>
							<th>ALLOCATION</th>
							<th style={{ textAlign: 'right' }}>LAST UPDATE</th>
						</tr>
					</thead>
					<tbody className="mono-data">
						{stats?.activeProjects?.slice(0, 5).map((project, i) => (
							<tr key={i}>
								<td style={{ textAlign: 'center' }}>
									<div className={`status-indicator status-${project.status.toLowerCase()}`}></div>
								</td>
								<td style={{ fontWeight: '600' }}>{project.id}</td>
								<td style={{ color: 'var(--outline)' }}>{project.allocation} Tasks</td>
								<td style={{ textAlign: 'right', color: 'var(--outline)' }}>{formatRelativeTime(project.lastUpdate)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Resource Matrix */}
			<div className="bento-card matrix-card">
				<div className="card-header-flex">
					<span className="label-caps">Resource Matrix</span>
					<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>apps</span>
				</div>
				<div className="matrix-container">
					<div className="matrix-grid" style={{ gridTemplateColumns: `40px repeat(${stats?.resourceMatrix?.projects?.length || 5}, 1fr)` }}>
						{/* Headers */}
						<div></div>
						{stats?.resourceMatrix?.projects?.map((p, i) => (
							<div key={i} className="matrix-header-cell mono-data">{p.charAt(0)}</div>
						))}
						
						{/* Rows */}
						{stats?.resourceMatrix?.agents?.map((agent, i) => (
							<React.Fragment key={i}>
								<div className="matrix-row-label mono-data">{agent?.split('-').pop() || agent}</div>
								{stats.resourceMatrix.projects.map((project, j) => {
									const assignment = stats.resourceMatrix.assignments.find(a => a.agent === agent && a.project === project);
									let cellClass = "";
									if (assignment) {
										const diff = (new Date() - new Date(assignment.lastInteraction)) / 1000;
										if (diff < 300) cellClass = "matrix-cell-active";
										else if (diff < 3600) cellClass = "matrix-cell-warm";
										else cellClass = "matrix-cell-stale";
									}
									return <div key={j} className={`matrix-cell ${cellClass}`}></div>;
								})}
							</React.Fragment>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Overview;
