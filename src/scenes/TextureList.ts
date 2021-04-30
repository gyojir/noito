import { ValueOf } from '../libs/util/util';
const TextureLists = {
  Entity: { 
    key: 'entity',
    path: 'images/entity.bmp'
  },
  Bullet: {
    key: 'bullet',
    path: 'images/bullet.bmp'
  }
}

export default TextureLists;
export const toTexParams = (texParam: ValueOf<typeof TextureLists>) : [string, string]=> {
  return [texParam.key, texParam.path];
}