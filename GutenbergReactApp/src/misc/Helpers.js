import { useState, useEffect } from 'react';
import { parse, createBlock } from '@wordpress/blocks';

// MARK: Misc

// Returns BlockInstance[]
export function instantiateBlocksFromContent(content) {
    const convertParsedBlocksToBlockInstances = (parsedBlocks) => {
        return parsedBlocks.map(parsedBlock => {
            const { name, attributes, innerBlocks } = parsedBlock;
            const convertedInnerBlocks = convertParsedBlocksToBlockInstances(innerBlocks);
            return createBlock(name, attributes, convertedInnerBlocks);
        });
    };
    const parsedBlocks = parse(content); // Returns ParsedBlock[]
    return convertParsedBlocksToBlockInstances(parsedBlocks);
}

// MARK: Dimensions Hook

function getWindowDimensions() {
    const { innerWidth: width, innerHeight: height } = window;
    return {
        width,
        height
    };
}

export function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

    useEffect(() => {
        function handleResize() {
            setWindowDimensions(getWindowDimensions());
        }

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return windowDimensions;
}
