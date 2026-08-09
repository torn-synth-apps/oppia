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
 * @fileoverview Headroom Directive (not associated with reusable
 * components.)
 * NB: Reusable component directives should go in the components/ folder.
 */

import {
  Directive,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import Headroom from 'headroom.js';

// Headroom registers its scroll tracker 100ms after init() is called, so that
// the browser has a chance to restore a previously saved scroll position
// first. Its destroy() dereferences that tracker without checking whether it
// exists, so tearing an instance down within this window throws.
const SCROLL_TRACKER_REGISTRATION_DELAY_MSECS = 100;

// Headroom's type definitions do not expose the internal scroll tracker, so
// this type is used to check whether it has been registered yet.
type HeadroomWithScrollTracker = Headroom & {
  scrollTracker?: {destroy: () => void};
};

@Directive({
  selector: '[headroom]',
})
export class HeadroomDirective implements OnDestroy {
  @Input() tolerance?: Headroom.Tolerance;
  @Output() toleranceChange: EventEmitter<Headroom.Tolerance> =
    new EventEmitter();

  @Input() offset?: number;
  @Output() offsetChange?: number;
  @Input() classes?: {[key: string]: string};
  @Output() classesChange: EventEmitter<{[key: string]: string}> =
    new EventEmitter();

  @Input() scroller?: ElementRef;
  headroom: Headroom;

  constructor(private el: ElementRef) {
    let headroomOptions: Headroom.HeadroomOptions = {
      tolerance: this.tolerance ? this.tolerance : Headroom.options.tolerance,
      offset: this.offset ? this.offset : Headroom.options.offset,
      scroller: this.scroller
        ? document.querySelector(this.scroller.nativeElement)
        : Headroom.options.scroller,
      classes: this.classes ? this.classes : Headroom.options.classes,
    };

    this.headroom = new Headroom(this.el.nativeElement, headroomOptions);
    this.headroom.init();
  }

  ngOnDestroy(): void {
    if (this.destroyHeadroomIfTrackerRegistered()) {
      return;
    }

    // The scroll tracker has not been registered yet. Destroying now would
    // throw, and when the directive is destroyed as part of a route change
    // (which happens on pages that redirect as soon as their data loads), that
    // error aborts the in-flight navigation. Retrying once the registration
    // has happened keeps the scroll listeners from leaking. This timer is
    // created after Headroom's own one, so it always fires later.
    setTimeout(() => {
      this.destroyHeadroomIfTrackerRegistered();
    }, SCROLL_TRACKER_REGISTRATION_DELAY_MSECS);
  }

  /**
   * Destroys the Headroom instance, but only once its scroll tracker has been
   * registered, since destroy() throws otherwise.
   * @returns Whether the instance was destroyed.
   */
  private destroyHeadroomIfTrackerRegistered(): boolean {
    const headroom = this.headroom as HeadroomWithScrollTracker;
    if (headroom.scrollTracker === undefined) {
      return false;
    }

    headroom.destroy();
    return true;
  }
}
