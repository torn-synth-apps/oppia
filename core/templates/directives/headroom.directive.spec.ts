// Copyright 2021 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview Unit tests for headroom directive
 */

import {Component} from '@angular/core';
import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import {By} from '@angular/platform-browser';
import Headroom from 'headroom.js';
import {HeadroomDirective} from './headroom.directive';

// Headroom's type definitions do not expose the internal scroll tracker, which
// these tests need to control in order to exercise both teardown paths.
type HeadroomWithScrollTracker = Headroom & {
  scrollTracker?: {destroy: () => void};
};

@Component({
  selector: 'mock-comp-a',
  template: '  <span headroom></span>',
})
class MockCompA {}

describe('Headroom Directive', () => {
  let fixture: ComponentFixture<MockCompA>;
  let directiveInstance: HeadroomDirective;
  let headroom: HeadroomWithScrollTracker;

  beforeEach(waitForAsync(() => {
    // Headroom registers its scroll tracker in a timer set by init(), so the
    // initialization is stubbed out to keep the registration, and hence the
    // teardown path taken by the directive, under the control of the tests.
    spyOn(Headroom.prototype, 'init');

    TestBed.configureTestingModule({
      declarations: [MockCompA, HeadroomDirective],
    }).compileComponents();
  }));

  beforeEach(waitForAsync(() => {
    fixture = TestBed.createComponent(MockCompA);
    const directiveEl = fixture.debugElement.query(
      By.directive(HeadroomDirective)
    );
    expect(directiveEl).not.toBeNull();

    directiveInstance = directiveEl.injector.get(HeadroomDirective);
    headroom = directiveInstance.headroom as HeadroomWithScrollTracker;
  }));

  it('should create', () => {
    expect(directiveInstance.headroom).toBeDefined();
  });

  it('should destroy', () => {
    headroom.scrollTracker = {destroy: () => {}};
    spyOn(headroom, 'destroy');

    directiveInstance.ngOnDestroy();

    expect(headroom.destroy).toHaveBeenCalled();
  });

  it('should defer the destruction until the scroll tracker is registered', fakeAsync(() => {
    spyOn(headroom, 'destroy');

    directiveInstance.ngOnDestroy();

    expect(headroom.destroy).not.toHaveBeenCalled();

    headroom.scrollTracker = {destroy: () => {}};
    tick(100);

    expect(headroom.destroy).toHaveBeenCalled();
  }));

  it('should not destroy if the scroll tracker is never registered', fakeAsync(() => {
    spyOn(headroom, 'destroy');

    directiveInstance.ngOnDestroy();
    tick(100);

    expect(headroom.destroy).not.toHaveBeenCalled();
  }));
});
