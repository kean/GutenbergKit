/**
 * WordPress dependencies
 */
import { useEffect, useState } from '@wordpress/element';
import {
	BlockEditorKeyboardShortcuts,
	BlockEditorProvider,
    BlockCanvas,
	BlockList,
	BlockTools,
	BlockInspector,
	WritingFlow,
	ObserveTyping,
} from '@wordpress/block-editor';
import { Popover, SlotFillProvider } from '@wordpress/components';
import { registerCoreBlocks } from '@wordpress/block-library';
import '@wordpress/format-library';

/**
 * Internal dependencies
 */

function Editor() {
	const [ blocks, updateBlocks ] = useState( [] );

	useEffect( () => {
		registerCoreBlocks();
	}, [] );

	return (
        <BlockEditorProvider><BlockCanvas/></BlockEditorProvider>

		// <div className="playground">
    
        //     <SlotFillProvider>
        //         <BlockEditorProvider
        //             value={ blocks }
        //             onInput={ updateBlocks }
        //             onChange={ updateBlocks }
        //         >
        //             <div className="playground__sidebar">
        //                 <BlockInspector />
        //             </div>
        //             <div className="playground__content">
        //                 <BlockTools>
        //                     <div className="editor-styles-wrapper">
        //                         <BlockEditorKeyboardShortcuts.Register />
        //                         <WritingFlow>
        //                             <ObserveTyping>
        //                                 <BlockList />
        //                             </ObserveTyping>
        //                         </WritingFlow>
        //                     </div>
        //                 </BlockTools>
        //             </div>
        //             <Popover.Slot />
        //         </BlockEditorProvider>
        //     </SlotFillProvider>
		// </div>
	);
}

export default Editor;