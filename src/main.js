// src/main.js
import { Crepe } from '@milkdown/crepe';
import { insert } from '@milkdown/utils'; // <--- Import this
import { commandsCtx } from '@milkdown/core';
import "./theme.css";

export const createEditor = async (root, options = {}) => {
    const { defaultValue, onUpdate, slashCommands = [] } = options;

    const crepe = new Crepe({
        root: root,
        defaultValue: defaultValue || '',
        featureConfigs: {
            [Crepe.Feature.Slash]: {
                items: (prevItems) => {
                    const customItems = slashCommands.map((cmd) => ({
                        title: cmd.name,
                        keyword: [cmd.name, 'embed', cmd.category],
                        onRun: (ctx) => {
                            // 1. If the command has a custom handler (for browsing), run it
                            if (cmd.handler) {
                                cmd.handler(); 
                                return;
                            }

                            // 2. Otherwise, insert the data as Markdown/HTML
                            // This function parses the string and renders it immediately
                            ctx.get(commandsCtx).call(insert(cmd.data));
                        },
                    }));
                    return [...prevItems, ...customItems];
                },
            },
        },
    });

    if (onUpdate) {
        crepe.on((listener) => {
            listener.markdownUpdated((ctx, markdown, prevMarkdown) => {
                onUpdate(markdown);
            });
        });
    }

    await crepe.create();

    return {
        destroy: () => crepe.destroy(),
        setReadonly: (val) => crepe.setReadonly(val),
    };
};