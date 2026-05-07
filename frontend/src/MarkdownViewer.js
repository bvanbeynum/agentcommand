import React from 'react';

const MarkdownViewer = ({ content }) => {
	// Simple Markdown to HTML converter
	const parseMarkdown = (md) => {
		if (!md) return '';
		
		const codeBlocks = [];
		let html = md.replace(/```(?:[a-z]*)?\n([\s\S]*?)```/gim, (match, code) => {
			const id = codeBlocks.length;
			codeBlocks.push(`<pre class="mono-data"><code>${code}</code></pre>`);
			return `___CODE_BLOCK_${id}___`;
		});

		// 2. Tables
		const lines = html.split('\n');
		let inTable = false;
		
		const processedLines = lines.map(line => {
			const trimmed = line.trim();
			if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
				const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
				if (!inTable) {
					inTable = true;
					return `<table class="markdown-table"><thead><tr>${cells.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>`;
				} else if (trimmed.includes('---')) {
					return ''; // Skip the divider line
				} else {
					return `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
				}
			} else {
				if (inTable) {
					inTable = false;
					return '</tbody></table>' + line;
				}
				return line;
			}
		});
		
		html = processedLines.filter(l => l !== '').join('\n');
		if (inTable) html += '</tbody></table>';

		// 3. Bullets
		html = html.replace(/^[ \t]*\* (.*$)/gim, '<ul><li>$1</li></ul>');
		html = html.replace(/<\/ul>\n<ul>/gim, ''); 

		// 4. Inline formatting & Headers
		html = html
			.replace(/^### (.*$)/gim, '<h3>$1</h3>')
			.replace(/^## (.*$)/gim, '<h2>$1</h2>')
			.replace(/^# (.*$)/gim, '<h1>$1</h1>')
			.replace(/^\> (.*$)/gim, '<blockquote>$1</blockquote>')
			.replace(/\*\*(.+?)\*\*/gim, '<b>$1</b>')
			.replace(/\*(.+?)\*/gim, '<i>$1</i>')
			.replace(/`([^`]+)`/gim, '<code class="inline-code">$1</code>')
			.replace(/!\[(.*?)\]\((.*?)\)/gim, "<img alt='$1' src='$2' />")
			.replace(/\[(.*?)\]\((.*?)\)/gim, "<a href='$2'>$1</a>");
		
		// 5. Paragraphs
		let finalHtml = html.split('\n').map(line => {
			const trimmed = line.trim();
			if (trimmed === '') return '<br/>';
			if (trimmed.startsWith('<') || trimmed.startsWith('___CODE_BLOCK_')) return line;
			return `<p>${line}</p>`;
		}).join('');

		// 6. Restore Code Blocks
		codeBlocks.forEach((block, i) => {
			finalHtml = finalHtml.replace(`___CODE_BLOCK_${i}___`, block);
		});

		return finalHtml;
	};

	return (
		<div 
			className="markdown-body"
			dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
		/>
	);
};

export default MarkdownViewer;
