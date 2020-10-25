import { Constructor, InstanceOf } from './util';

export class ObjectPool<T> {
  objects: (T|undefined)[] = [];
  freeList: T[] = [];
  chunkSize: number;
  
  constructor(size: number, chunkSize: number = 10) {
    this.chunkSize = chunkSize;
    this.reserve(size);
  }
  
  reserve(n: number) {
    while(this.objects.length < n)
    {
      for(let i = 0; i < this.chunkSize; i++)
      {
        this.objects.push(undefined);
      }
    }
  }

  alloc(): {obj: T | undefined} {
    if (this.freeList.length == 0)
    {
        this.reserve(this.objects.length + this.chunkSize)
    }

    return {obj: this.freeList.pop()};
  }

  free(obj: T) {  
    this.freeList.push(obj);
  }
}