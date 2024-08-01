import './index.css';

function injectStyles(styles) {
	const styleContainer = document.createElement('div');
	styleContainer.innerHTML = styles.replace(/(href=['"])\/\//g, '$1https://');
	document.head.appendChild(styleContainer);
}

function injectScripts(scripts) {
	const scriptContainer = document.createElement('div');
	const sanitizedScripts = scripts
		.replace(/\\"/g, "'")
		.replace(/src="\/\//g, 'src="https://');
	scriptContainer.innerHTML = sanitizedScripts;
	const scriptTags = Array.from(scriptContainer.querySelectorAll('script'));

	function loadScript(index) {
		if (index >= scriptTags.length) return Promise.resolve();

		return new Promise((resolve) => {
			const scriptTag = scriptTags[index];
			const newScript = document.createElement('script');

			if (scriptTag.src) {
				newScript.src = scriptTag.src;
				newScript.onload = () => resolve();
				newScript.onerror = () => resolve(); // Continue even if a script fails to load
			} else {
				const blob = new Blob([scriptTag.textContent], {
					type: 'application/javascript',
				});
				const url = URL.createObjectURL(blob);
				newScript.src = url;
				newScript.onload = () => {
					URL.revokeObjectURL(url);
					resolve();
				};
				newScript.onerror = () => {
					URL.revokeObjectURL(url);
					resolve(); // Continue even if a script fails to load
				};
			}

			if (scriptTag.id) {
				newScript.id = scriptTag.id;
			}

			document.body.appendChild(newScript);
		}).then(() => loadScript(index + 1));
	}

	return loadScript(0);
}

window.GBKit = window.GBKit || JSON.parse(localStorage.getItem('GBKit')) || {};

const fetchData = async () => {
	const { siteUrl, apiToken } = window.GBKit;
	if (!siteUrl) {
		console.error('GBKit siteUrl not defined');
		return;
	}

	try {
		const response = await fetch(
			`${siteUrl}/wp-json/beae/v1/editor-assets`,
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiToken}`,
				},
			}
		);
		const { styles, scripts } = await response.json();
		injectStyles(styles);
		await injectScripts(scripts);
	} catch (error) {
		console.error('Error fetching block types:', error);
	}
};

fetchData().then(() => {
	// Defer loading App until WP globals are defined and third-party scripts are loaded
	const { React } = window;
	import('./App.jsx').then(({ default: App }) => {
		window.ReactDOM.createRoot(document.getElementById('root')).render(
			<React.StrictMode>
				<App />
			</React.StrictMode>
		);
	});
});
