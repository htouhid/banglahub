import { SeoService } from '../../core/services/seo.service';
import { MatIconModule } from '@angular/material/icon';
import { makeStateKey, TransferState, PLATFORM_ID, Component, DestroyRef, effect, inject, PendingTasks, signal } from '@angular/core';
import { DatePipe, isPlatformServer } from '@angular/common';
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
 private readonly seo=inject(SeoService);
 private readonly transfer=inject(TransferState);
 private readonly server=isPlatformServer(inject(PLATFORM_ID));
 private readonly api=inject(SupabaseService);
 private readonly pending=inject(PendingTasks);
 private readonly destroy=inject(DestroyRef);
 private generation=0;
 constructor(){
  effect(()=>{const id=this.params()?.get('id');if(id)void this.pending.run(()=>this.load(id));});
 }
 async load(id=this.params()?.get('id')??''):Promise<void>{
  const generation=++this.generation;this.loading.set(true);this.error.set('');this.event.set(null);
  try{
   const key=makeStateKey<CommunityEvent|null>('seo-event-'+id);
   const row=this.transfer.hasKey(key)?this.transfer.get(key,null):await this.api.getCommunityEvent(id);
   if(this.server)this.transfer.set(key,row);else this.transfer.remove(key);
   if(generation===this.generation&&!this.destroy.destroyed){this.event.set(row);if(row)this.seo.setEvent(row);}
  }
  catch{if(generation===this.generation&&!this.destroy.destroyed)this.error.set('Unable to load this event.');}
  finally{if(generation===this.generation&&!this.destroy.destroyed)this.loading.set(false);}
 }
}
