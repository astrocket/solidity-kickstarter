const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');

const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath); // fs-extra 의 기능 폴더를 통으로 삭제

const campaignPath = path.resolve(__dirname, 'contracts', 'Campaign.sol');
const source = fs.readFileSync(campaignPath, 'utf8');
// 아래의 결과로 두개의 컨트랙 컴파일 결과가 json 구조로 뿌려진다.
const outputs = solc.compile(source, 1).contracts;

fs.ensureDirSync(buildPath);

console.log(outputs);
// 루프 돌리면서 파일 생성
for (let contract in outputs) {
  // .json파일 제조
  fs.outputJsonSync(
    path.resolve(buildPath, `${contract.replace(':', '')}.json`),
    outputs[contract]
  );
}
