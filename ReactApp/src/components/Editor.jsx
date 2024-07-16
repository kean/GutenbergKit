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
import { parse, serialize, registerBlockType } from '@wordpress/blocks';

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
// import CodeEditor from './CodeEditor';

// Current editor (assumes can be only one instance).
let editor = {};

function Editor() {
	const [blocks, setBlocks] = useState([]);
	const [registeredBlocks, setRegisteredBlocks] = useState([]);
	const [isCodeEditorEnabled, setCodeEditorEnabled] = useState(false);

	useEffect(() => {
		let isCurrent = true;

		const fetchData = async () => {
			try {
				const response = await fetch(
					'http://localhost:8881/?rest_route=/wp/v2/block-types/jetpack',
					{
						headers: {
							Authorization: 'Basic <token>',
						},
					}
				);
				const data = await response.json();
				if (!isCurrent) {
					return;
				}
				console.log('>>> fetched block types:', data);
				data.forEach((block) => {
					registerBlockType(block.name, block);
				});
				appendStylesAndScripts(data);
			} catch (error) {
				console.error('Error fetching block types:', error);
			}
		};

		fetchData();

		return () => {
			isCurrent = false;
			getBlockTypes().forEach((block) => {
				unregisterBlockType(block.name);
			});
		};
	}, []);

	function appendStylesAndScripts(blockTypes) {
		const styles = blockTypes
			.flatMap((block) => block.style_paths)
			.filter((style) => style);
		const scripts = blockTypes
			.flatMap((block) => block.script_paths)
			.filter((script) => script);

		console.log('>>>', { styles, scripts });

		styles.forEach((style) => {
			const link = document.createElement('link');
			link.rel = 'stylesheet';
			link.href = style;
			document.head.appendChild(link);
		});

		scripts.forEach((script) => {
			const scriptTag = document.createElement('script');
			scriptTag.src = script;
			document.body.appendChild(scriptTag);
		});
	}

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
