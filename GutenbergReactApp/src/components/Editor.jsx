/* React */
import { useEffect, useState } from 'react';

/* WordPress */
import {
    BlockEditorProvider,
    BlockCanvas,
} from "@wordpress/block-editor"
import { registerCoreBlocks } from '@wordpress/block-library';
import { serialize } from '@wordpress/blocks';

import '@wordpress/components/build-style/style.css';
import '@wordpress/block-editor/build-style/style.css';
import '@wordpress/block-library/build-style/style.css';
import '@wordpress/block-library/build-style/editor.css';
import '@wordpress/block-library/build-style/theme.css';

/* Internal */

import EditorToolbar from './EditorToolbar';
import { instantiateBlocksFromContent, useWindowDimensions } from '../misc/Helpers';

// Current editor (assumes can be only one instance).
let editor = {};

function Editor() {
    const [blocks, updateBlocks] = useState([]);
    const { height, width } = useWindowDimensions();
    const [isBlockInspectorShown, setBlockInspectorShown] = useState(false);

    function onInput(blocks) {
        updateBlocks(blocks);
    };

    function onChange(blocks) {
        updateBlocks(blocks);

        // TODO: this doesn't include everything
        const isEmpty = blocks.length === 0 || (blocks[0].name == "core/paragraph" && blocks[0].attributes.content.trim() === "");
        postMessage({ message: "onBlocksChanged", body: { isEmpty: isEmpty } });
    };

    editor.setContent = (content) => {
        updateBlocks(instantiateBlocksFromContent(content));
    };

    editor.setInitialContent = (content) => {
        const blocks = instantiateBlocksFromContent(content);
        onChange(blocks); // TODO: redesign this
        return serialize(blocks);
    }

    editor.getContent = () => serialize(blocks);

    // Warning: `useEffect` and functions captured it in can't read the latest useState values,
    // and hence `useRef`.
    useEffect(() => {
        window.editor = editor;
        registerCoreBlocks();
        postMessage({ message: "onEditorLoaded" });
    }, []);

    // Injects CSS styles in the canvas iframe.
    const style = `
    body { 
        padding: 16px; 
        font-family: -apple-system; 
        line-height: 1.55;
    }
    .rich-text:focus { 
        outline: none; 
    }
    .block-editor-block-list__block {
        overflow: hidden;
    }
    `

    // The problem with the editor canvas is that it gets embedded in an iframe
    // so there is no way to style it directly using CSS included in the project itself.
    const styles = [
        { css: style }
    ];

    const settings = {
        hasFixedToolbar: true
    };

    return (
        <BlockEditorProvider
            value={blocks}
            onInput={onInput}
            onChange={onChange}
            settings={settings}
        >
            <div className='gbkit-canvas-container' style={{ width: `${width}px` }}>
                <BlockCanvas height={`${height}px`} styles={styles} />
                {/* <BlockBreadcrumb /> */}
                {/* <div className='gbkit-debug-toolbar'>
                        <button type="button" onClick={() => window.postMessage({ event: "toggleBlockSettingsInspector" })}>
                            Toogle Block Settings
                        </button>
                    </div> */}
            </div>
            {/* <div className='gbkit-spacer'></div>
                {!isBlockInspectorShown &&
                    <div className="block-inspector-siderbar">
                        <BlockInspector />
                    </div>} */}
            <EditorToolbar onSettingsTapped={() => { setBlockInspectorShown(true) }} />
        </BlockEditorProvider>
    );
}

function postMessage(message) {
    if (window.webkit) {
        window.webkit.messageHandlers.editorDelegate.postMessage(message);
    };
};

export default Editor;