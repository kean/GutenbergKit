import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import * as react from 'react';
import * as reactDom from 'react-dom';
import * as wpBlocks from '@wordpress/blocks';
import * as wpElement from '@wordpress/element';
import * as wpPrimitives from '@wordpress/primitives';
import * as wpCompose from '@wordpress/compose';
import * as wpData from '@wordpress/data';
import * as wpBlockEditor from '@wordpress/block-editor';
import * as wpBlockLibrary from '@wordpress/block-library';
import * as wpI18n from '@wordpress/i18n';
import * as wpComponents from '@wordpress/components';
import * as wpHooks from '@wordpress/hooks';
import * as wpUrl from '@wordpress/url';
import * as wpEditSite from '@wordpress/edit-site';
import apiFetch from '@wordpress/api-fetch';
import * as wpDate from '@wordpress/date';
import domReady from '@wordpress/dom-ready';
import * as wpPlugins from '@wordpress/plugins';
import * as wpViewport from '@wordpress/viewport';
import * as wpRichText from '@wordpress/rich-text';
import * as wpEditor from '@wordpress/editor';
import * as wpCoreData from '@wordpress/core-data';
import * as wpBlob from '@wordpress/blob';
import TokenList from '@wordpress/token-list';

window.wp = window.wp || {};
window.wp.blocks = wpBlocks;
window.wp.element = wpElement;
window.wp.primitives = wpPrimitives;
window.wp.compose = wpCompose;
window.wp.data = wpData;
window.wp.blockEditor = wpBlockEditor;
window.wp.blockLibrary = wpBlockLibrary;
window.wp.i18n = wpI18n;
window.wp.components = wpComponents;
window.wp.hooks = wpHooks;
window.wp.url = wpUrl;
window.wp.editSite = wpEditSite;
window.wp.apiFetch = apiFetch;
window.wp.date = wpDate;
window.wp.domReady = domReady;
window.wp.plugins = wpPlugins;
window.wp.viewport = wpViewport;
window.wp.richText = wpRichText;
window.wp.editor = wpEditor;
window.wp.coreData = wpCoreData;
window.wp.tokenList = TokenList;
window.wp.blob = wpBlob;
window.React = react;
window.ReactDOM = reactDom;

function injectStyles(styles) {
	const styleContainer = document.createElement('div');
	styleContainer.innerHTML = styles;
	document.head.appendChild(styleContainer);
}

function injectScripts(scripts) {
	const scriptContainer = document.createElement('div');
	const sanitizedScripts = scripts.replace(/\\"/g, "'");
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

const fetchData = async () => {
	try {
		const response = await fetch(
			'http://localhost:8881/?rest_route=/beae/v1/editor-assets'
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
	import('./App.jsx').then(({ default: App }) => {
		ReactDOM.createRoot(document.getElementById('root')).render(
			<React.StrictMode>
				<App />
			</React.StrictMode>
		);
	});
});
