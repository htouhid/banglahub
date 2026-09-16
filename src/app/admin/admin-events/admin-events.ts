import { Component, DestroyRef, inject, signal, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommunityEvent } from '../../core/models/community-event';
import { CITY_OPTIONS } from '../../shared/model/city-option.model';
@Component({selector:'app-admin-events',imports:[RouterLink,DatePipe],templateUrl:'./admin-events.html',styleUrl:'./admin-events.scss'})
export class AdminEvents implements OnInit {
 readonly markets=CITY_OPTIONS;
 readonly city=signal('');
 readonly events=signal<CommunityEvent[]>([]);
 readonly loading=signal(true);
 readonly error=signal('');
 readonly deleting=signal(false);
 readonly selected=signal<CommunityEvent|null>(null);
 private readonly api=inject(SupabaseService);
 private readonly destroy=inject(DestroyRef);
 private generation=0;
 ngOnInit(){void this.load();}
 async load(){
  const id=++this.generation; this.loading.set(true);this.error.set('');
  try{const rows=await this.api.getAdminEvents(this.city()||undefined);if(id===this.generation&&!this.destroy.destroyed)this.events.set(rows);}
  catch{if(id===this.generation)this.error.set('Unable to load events. Please try again.');}
  finally{if(id===this.generation&&!this.destroy.destroyed)this.loading.set(false);}
 }
 filter(value:string){this.city.set(value);this.selected.set(null);void this.load();}
 async remove(){
  const event=this.selected();if(!event||this.deleting())return;
  this.deleting.set(true);this.error.set('');
  try{await this.api.deleteCommunityEvent(event.id);this.selected.set(null);await this.load();}
  catch{this.error.set('Unable to delete the event. Please try again.');}
  finally{this.deleting.set(false);}
 }
}
