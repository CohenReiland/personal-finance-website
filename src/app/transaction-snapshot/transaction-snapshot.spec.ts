import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransactionSnapshot } from './transaction-snapshot';

describe('TransactionSnapshot', () => {
  let component: TransactionSnapshot;
  let fixture: ComponentFixture<TransactionSnapshot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransactionSnapshot]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransactionSnapshot);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
