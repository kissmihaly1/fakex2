import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecommendedUsersComponent } from './recommended-users.component';

describe('RecommendedUsersComponent', () => {
  let component: RecommendedUsersComponent;
  let fixture: ComponentFixture<RecommendedUsersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommendedUsersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecommendedUsersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
