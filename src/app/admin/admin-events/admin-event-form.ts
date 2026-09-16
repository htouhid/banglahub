import { Component, inject, OnInit, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { CommunityEventInput, safeEventUrl } from '../../core/models/community-event';
import { CITY_OPTIONS } from '../../shared/model/city-option.model';
const required=[Validators.required,Validators.pattern(/S/)];
const optionalUrl=(c:AbstractControl)=>!c.value?.trim()||safeEventUrl(c.value.trim())?null:{url:true};
@Component({selector:'app-admin-event-form',imports:[ReactiveFormsModule,RouterLink],templateUrl:'./admin-event-form.html',styleUrl:'./admin-events.scss'})
export class AdminEventForm implements OnInit {
 private readonly api=inject(SupabaseService);
 private readonly router=inject(Router);
 readonly id=inject(ActivatedRoute).snapshot.paramMap.get('id');
 readonly markets=CITY_OPTIONS;
 readonly categories=signal(['community','cultural','music','festival','sports','religious','food','family','professional','education','other']);
 readonly loading=signal(false);
 readonly saving=signal(false);
 readonly error=signal('');
 readonly found=signal(true);
 readonly failedImage=signal('');
 private readonly fb=inject(FormBuilder);
 readonly form=this.fb.nonNullable.group({
  title:['',required],short_description:[''],description:[''],category:['',required],
  market_city:['',required],city:['',required],state:['',required],venue_name:[''],address:[''],
  start_date:['',Validators.required],start_time:[''],end_date:[''],end_time:[''],
  image_url:[''],organizer_name:[''],event_url:['',optionalUrl],ticket_url:['',optionalUrl],
  admission_type:['unknown'],admission_details:[''],source_type:['admin'],source_name:[''],
  is_featured:[false],is_active:[true],
 });
 async ngOnInit(){
  if(!this.id)return;
  this.loading.set(true);
  try{
   const row=await this.api.getAdminEventById(this.id);
   if(!row){this.found.set(false);this.error.set('Event not found.');return;}
   if(!this.categories().includes(row.category))this.categories.update(values=>[...values,row.category]);
   for(const key of Object.keys(this.form.controls)){
    const value=row[key as keyof typeof row];
    this.form.get(key)!.setValue(value??'');
   }
  }catch{this.found.set(false);this.error.set('Unable to load this event. Return to the event list and try again.');}
  finally{this.loading.set(false);}
 }
 invalid(name:string){const c=this.form.get(name);return !!c?.touched&&!!c.invalid;}
 async save(){
  if(this.saving()||!this.found())return;
  this.form.markAllAsTouched();this.error.set('');
  if(this.form.invalid){this.error.set('Please correct the highlighted fields.');return;}
  const value=this.form.getRawValue();
  if(value.end_date&&value.end_date<value.start_date){this.error.set('End date cannot be before start date.');return;}
  if(value.start_time&&value.end_time&&(!value.end_date||value.end_date===value.start_date)&&value.end_time<value.start_time){this.error.set('End time must not precede start time on the same day.');return;}
  const payload=Object.fromEntries(Object.entries(value).map(([key,v])=>[key,typeof v==='string'?(v.trim()||null):v])) as CommunityEventInput;
  this.saving.set(true);
  try{
   if(this.id)await this.api.updateCommunityEvent(this.id,payload);else await this.api.createCommunityEvent(payload);
   await this.router.navigate(['/admin/events']);
  }catch{this.error.set('Unable to save this event. Please try again.');}
  finally{this.saving.set(false);}
 }
}
