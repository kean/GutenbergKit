import { useEffect, useState } from 'react';

// WordPress
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
	BlockList,
	BlockTools,
	WritingFlow,
	ObserveTyping,
} from '@wordpress/block-editor';
import { Popover } from '@wordpress/components';
import { getBlockTypes, unregisterBlockType } from '@wordpress/blocks';
import { registerCoreBlocks } from '@wordpress/block-library';
import { parse, serialize, store as blocksStore } from '@wordpress/blocks';
import { dispatch } from '@wordpress/data';

// Default styles that are needed for the editor.
import '@wordpress/components/build-style/style.css';
import '@wordpress/block-editor/build-style/style.css';

// Default styles that are needed for the core blocks.
import '@wordpress/block-library/build-style/style.css';
import '@wordpress/block-library/build-style/editor.css';
import '@wordpress/block-library/build-style/theme.css';

// Registers standard formatting options for RichText.
import '@wordpress/format-library';
import '@wordpress/format-library/build-style/style.css';

// Internal imports
import EditorToolbar from './EditorToolbar';
import { postMessage } from '../misc/Helpers';
import { __unstableResolvedAssets } from './BlocksAssets';
// import CodeEditor from './CodeEditor';

// Current editor (assumes can be only one instance).
let editor = {};

import * as react from 'react';
import * as reactDom from 'react-dom';
import * as wpBlocks from '@wordpress/blocks';
import * as wpElement from '@wordpress/element';
import * as wpPrimitives from '@wordpress/primitives';
import * as wpCompose from '@wordpress/compose';
import * as wpData from '@wordpress/data';
import * as wpBlockEditor from '@wordpress/block-editor';
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
	const scriptTags = scriptContainer.querySelectorAll('script');

	scriptTags.forEach((scriptTag) => {
		const newScript = document.createElement('script');

		if (scriptTag.src) {
			newScript.src = scriptTag.src;
		} else {
			const blob = new Blob([scriptTag.textContent], {
				type: 'application/javascript',
			});
			const url = URL.createObjectURL(blob);
			newScript.src = url;
		}

		if (scriptTag.id) {
			newScript.id = scriptTag.id;
		}

		document.body.appendChild(newScript);
	});
}

function Editor() {
	const [blocks, setBlocks] = useState([]);
	const [registeredBlocks, setRegisteredBlocks] = useState([]);
	const [isCodeEditorEnabled, setCodeEditorEnabled] = useState(false);

	function didChangeBlocks(blocks) {
		setBlocks(blocks);

		// TODO: this doesn't include everything
		const isEmpty =
			blocks.length === 0 ||
			(blocks[0].name == 'core/paragraph' &&
				blocks[0].attributes.content.trim() === '');
		postMessage('onBlocksChanged', { isEmpty: isEmpty });
	}

	editor.setContent = (content) => {
		setBlocks(parse(content));
	};

	editor.setInitialContent = (content) => {
		const blocks = parse(content);
		didChangeBlocks(blocks); // TODO: redesign this
		return serialize(blocks); // It's used for tracking changes
	};

	editor.getContent = () => serialize(blocks);

	editor.setCodeEditorEnabled = (enabled) => setCodeEditorEnabled(enabled);

	editor.registerBlocks = (blockTypes) => {
		// TODO: uncomment when the custom picker is ready (blocker: can't insert blocks)
		// setRegisteredBlocks(blockTypes);
		// TODO: uncomment to enable custom block registration
		// for (const blockType of blockTypes) {
		//     registerBlockType(blockType.name, blockType);
		// }
	};

	useEffect(() => {
		window.editor = editor;

		injectStyles(__unstableResolvedAssets.styles);
		injectScripts(__unstableResolvedAssets.scripts);

		// dispatch(blocksStore).reapplyBlockTypeFilters();

		registerCoreBlocks();
		postMessage('onEditorLoaded');

		return () => {
			window.editor = {};
			getBlockTypes().forEach((block) => {
				unregisterBlockType(block.name);
			});
		};
	}, []);

	const settings = {
		hasFixedToolbar: true,
		bodyPlaceholder: 'Hello!',
	};

	// if (isCodeEditorEnabled) {
	//     return <CodeEditor value={serialize(blocks)} />;
	// }

	return (
		<BlockEditorProvider
			value={blocks}
			onInput={didChangeBlocks}
			onChange={didChangeBlocks}
			settings={settings}
		>
			<BlockTools>
				<div className="editor-styles-wrapper">
					<BlockEditorKeyboardShortcuts.Register />
					<WritingFlow>
						<ObserveTyping>
							<BlockList />
							<EditorToolbar
								registeredBlocks={registeredBlocks}
							/>{' '}
							{/* not sure if optimal placement */}
						</ObserveTyping>
					</WritingFlow>
				</div>
			</BlockTools>
			<Popover.Slot />
		</BlockEditorProvider>
	);
}

export default Editor;
