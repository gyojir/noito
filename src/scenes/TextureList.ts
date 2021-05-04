import { ValueOf } from '../libs/util/util';
const TextureLists: {
  [key: string] : {
    key: string,
    path: string,
  }
} = {
}

export default TextureLists;
export const toTexParams = (texParam: ValueOf<typeof TextureLists>) : [string, string]=> {
  return [texParam.key, texParam.path];
}