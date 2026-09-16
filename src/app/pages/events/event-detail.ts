import { MatIconModule } from '@angular/material/icon';
import { afterNextRender, Component, DestroyRef, effect, inject, PendingTasks, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommunityEvent, eventTime, safeEventUrl } from '../../core/models/community-event';
import { EventVisual } from './event-visual';
@Component({
 selector:'app-event-detail',imports:[MatIconModule,RouterLink,DatePipe,EventVisual],templateUrl:'./event-detail.html',styleUrl:'./event-detail.scss'
})
export class EventDetail {
 readonly event=signal<CommunityEvent|null>(null);
 readonly loading=signal(true);
 readonly error=signal('');
 readonly time=eventTime;
 readonly url=safeEventUrl;
 private readonly params=toSignal(inject(ActivatedRoute).paramMap);
 private readonly ready=signal(false);
 private readonly api=inject(SupabaseService);
 private readonly pending=inject(PendingTasks);
 private readonly destroy=inject(DestroyRef);
 private generation=0;
 constructor(){
  afterNextRender(()=>this.ready.set(true));
  effect(()=>{const id=this.params()?.get('id');if(this.ready()&&id)void this.pending.run(()=>this.load(id));});
 }
 async load(id=this.params()?.get('id')??''):Promise<void>{
  const generation=++this.generation;this.loading.set(true);this.error.set('');this.event.set(null);
  try{const row=await this.api.getCommunityEvent(id);if(generation===this.generation&&!this.destroy.destroyed)this.event.set(row);}
  catch{if(generation===this.generation&&!this.destroy.destroyed)this.error.set('Unable to load this event.');}
  finally{if(generation===this.generation&&!this.destroy.destroyed)this.loading.set(false);}
 }
}
