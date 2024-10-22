import fs from 'node:fs'
import path from 'node:path'
import envPaths from 'env-paths'

export const paths = envPaths('cybermuse-desktop', {suffix: ''})
export const avatarsPath = path.resolve(paths.config, 'avatars')
export const modelsPath = path.resolve(paths.config, 'models')

if (!fs.existsSync(paths.config)) {
    console.log('Creating data directory')
    fs.mkdirSync(paths.config)
}
if (!fs.existsSync(avatarsPath)) {
    console.log('Creating avatars directory')
    fs.mkdirSync(avatarsPath)
}
if (!fs.existsSync(modelsPath)) {
    console.log('Creating models directory')
    fs.mkdirSync(modelsPath)
}
