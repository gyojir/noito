import { ValueOf } from '../libs/util/util';
const TextureLists = {
  Entity: { 
    key: 'entity',
    path: 'images/entity.bmp'
  },
  Entity2: {
    key: 'entity2',
    path: 'images/entity2.bmp'
  },
  Bullet: {
    key: 'bullet',
    path: 'images/bullet.bmp'
  },
  Background_0: {
    key: 'background',
    path: 'images/background.bmp'
  },
  Background_1: {
    key: 'background1',
    path: 'images/background1.bmp'
  }
}

export default TextureLists;
export const toTexParams = (texParam: ValueOf<typeof TextureLists>) : [string, string]=> {
  return [texParam.key, texParam.path];
}