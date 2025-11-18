import * as fs from 'fs';
import * as path from 'path';


const datasource = fs.readFileSync(path.join(__dirname, 'datasource.prisma'), 'utf-8');
const generator = fs.readFileSync(path.join(__dirname, 'generator.prisma'), 'utf-8');
const schemaDirs = fs.readdirSync(path.join(__dirname, 'schemas'));

let models = '';
schemaDirs.forEach(dir => {
  const dirPath = path.join(__dirname, 'schemas', dir);
  if (fs.lstatSync(dirPath).isDirectory()) {
    const modelPath = path.join(dirPath, 'index.prisma');
    if (fs.existsSync(modelPath)) {
      const model = fs.readFileSync(modelPath, 'utf-8');
      models += model + '\n';
    }
  }
});

 

const schema = `${datasource}\n${generator}\n${models}`;
fs.writeFileSync(path.join(__dirname, 'schema.prisma'), schema);

console.log('Prisma schema generated successfully.');