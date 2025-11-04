import { TestBed } from '@angular/core/testing';

import { UserGraphQl } from './user-graph-ql';

describe('UserGraphQl', () => {
  let service: UserGraphQl;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserGraphQl);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
