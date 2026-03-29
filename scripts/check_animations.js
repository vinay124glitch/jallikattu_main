import fs from 'fs';

function extractAnimations(filePath) {
    try {
        const buffer = fs.readFileSync(filePath);
        const magic = buffer.readUInt32LE(0);
        if (magic !== 0x46546c67) {
            console.error('Not a GLB file');
            return;
        }
        const version = buffer.readUInt32LE(4);
        const length = buffer.readUInt32LE(8);

        // Read JSON chunk
        const chunkLength = buffer.readUInt32LE(12);
        const chunkType = buffer.readUInt32LE(16);
        if (chunkType !== 0x4e4f534a) {
            console.error('No JSON chunk found');
            return;
        }

        const jsonStr = buffer.toString('utf8', 20, 20 + chunkLength);
        const gltf = JSON.parse(jsonStr);

        if (gltf.animations) {
            console.log('Animations:');
            gltf.animations.forEach((anim, i) => {
                console.log(`- ${anim.name || 'Unnamed ' + i}`);
            });
        } else {
            console.log('No animations found');
        }
    } catch (err) {
        console.error('Error:', err.message);
    }
}

extractAnimations('d:/jallikattu-jam-main/public/models/bull.glb');
