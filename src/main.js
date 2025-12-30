import { Crepe } from '@milkdown/crepe';
import { insert } from '@milkdown/utils';
import { commandsCtx, editorViewOptionsCtx } from '@milkdown/core';
import "./theme.css";

const TAG = '[Milkdown-Debug]';

export const createEditor = async (root, config = {}) => {
    //console.log(`${TAG} 1. Function called. Checking dependencies...`);

    // 1. Sanity Check: Is Crepe actually imported?
    if (!Crepe) {
        console.error(`${TAG} ❌ FATAL: 'Crepe' is undefined. The bundle is broken or import failed.`);
        return;
    }
    //console.log(`${TAG} 2. Crepe Class exists. Features available:`, Object.keys(Crepe.Feature || {}));

    // 2. Sanity Check: Is Root valid?
    if (!root || !root.tagName) {
        console.error(`${TAG} ❌ FATAL: 'root' element is invalid.`, root);
        return;
    }
    //console.log(`${TAG} 3. Root element found:`, root.tagName, root.className);

    try {
        const { 
            defaultValue = '', 
            placeholder = 'Type /...',
            readOnly = false,
            onUpdate, onFocus, onBlur,
            uploadHandler,
            customSlashCommands = [],
            featureConfigOverrides = {} 
        } = config;

        //console.log(`${TAG} 4. Config destructuring done.`);

        // 3. Construct Feature Config safely
        const featureConfigs = {};
        
        try {
            //console.log(`${TAG} 5. Building Feature Configs...`);
            
            // Slash Menu
            featureConfigs[Crepe.Feature.Slash] = {
                items: (prevItems) => {
                    //console.log(`${TAG} [Internal] Slash menu builder running...`);
                    const newItems = customSlashCommands.map(cmd => ({
                        title: cmd.title,
                        keyword: cmd.keyword || [cmd.title.toLowerCase()],
                        icon: cmd.icon, 
                        onRun: (ctx) => {
                            if (cmd.run) cmd.run(ctx);
                        }
                    }));
                    return [...prevItems, ...newItems];
                }
            };

            // Image Block
            featureConfigs[Crepe.Feature.ImageBlock] = {
                onUpload: (file) => {
                    //console.log(`${TAG} [Internal] Image upload triggered for`, file.name);
                    if (uploadHandler) return uploadHandler(file);
                    return undefined;
                }
            };

            // Placeholder
            featureConfigs[Crepe.Feature.Placeholder] = {
                text: placeholder
            };

            //console.log(`${TAG} 6. Feature Configs built successfully.`);
        } catch (err) {
            console.error(`${TAG} ❌ Error building config object:`, err);
        }

        // 4. Instantiate Crepe
        //console.log(`${TAG} 7. Attempting 'new Crepe({...})' ...`);
        const crepe = new Crepe({
            root: root,
            defaultValue: defaultValue,
            featureConfigs: {
                ...featureConfigs,
                ...featureConfigOverrides
            },
        });
        //console.log(`${TAG} 8. 'new Crepe' instance created!`, crepe);

        // 5. Configure Editor (Editable/Readonly)
        //console.log(`${TAG} 9. Configuring Editor View Options...`);
        crepe.editor.config((ctx) => {
            ctx.update(editorViewOptionsCtx, (prev) => ({
                ...prev,
                editable: () => !readOnly,
            }));
        });

        // 6. Listeners
        //console.log(`${TAG} 10. Attaching Listeners...`);
        crepe.on((listener) => {
            if (onUpdate) listener.markdownUpdated((ctx, md) => onUpdate(md));
            if (onFocus) listener.focus((ctx) => onFocus(ctx));
            if (onBlur) listener.blur((ctx) => onBlur(ctx));
        });

        // 7. Create
        //console.log(`${TAG} 11. calling 'await crepe.create()'... (This is where it might stall)`);
        await crepe.create();
        //console.log(`${TAG} 12. ✅ 'crepe.create()' finished! Editor should be on screen.`);

        // 8. CSS Force Fix (Apply strictly after creation)
        root.style.height = "100%";
        root.style.display = "flex";
        root.style.flexDirection = "column";
        // Try to find internal ProseMirror and force style it
        setTimeout(() => {
            const pm = root.querySelector('.ProseMirror');
            //console.log(`${TAG} 13. DOM Check - ProseMirror Element found?`, !!pm);
            if (pm) {
                pm.style.flexGrow = "1";
                pm.style.outline = "none";
                pm.style.minHeight = "100%";
            }
        }, 100);

        return {
            destroy: () => crepe.destroy(),
            setReadonly: (val) => crepe.setReadonly(val),
            insert: (markdown) => {
                crepe.editor.action((ctx) => {
                    const view = ctx.get(commandsCtx);
                    view.call(insert(markdown));
                });
            },
            getMarkdown: () => crepe.getMarkdown(),
        };

    } catch (globalError) {
        console.error(`${TAG} ❌❌❌ CRASH inside createEditor:`, globalError);
        // Throw it again so Alpine knows something went wrong
        throw globalError;
    }
};