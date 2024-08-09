import { useEffect, useState, useRef } from 'react';

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
	const scrollRef = useRef({
		lastScrollTop: 0,
		lastScrollTime: Date.now(),
	});

	// Dismiss virtual keyboard when scrolling quickly or over long distances.
	// This rudimentary implementation needs a lot of improvements.
	useEffect(() => {
		const scrollEl = document.scrollingElement;

		function onScroll() {
			const { lastScrollTop, lastScrollTime } = scrollRef.current;
			const scrollDistance = Math.abs(scrollEl.scrollTop - lastScrollTop);
			const scrollSpeed = scrollDistance / (Date.now() - lastScrollTime);
			const focusedElement = document.activeElement;

			if (focusedElement && (scrollDistance > 100 || scrollSpeed > 2)) {
				focusedElement.blur();
			}

			scrollRef.current = {
				lastScrollTop: scrollEl.scrollTop,
				lastScrollTime: Date.now(),
			};
		}

		if (scrollEl) {
			document.addEventListener('scroll', onScroll);

			return () => {
				document.removeEventListener('scroll', onScroll);
			};
		}
	}, []);

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
