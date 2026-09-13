import { Component } from '@angular/core';
import { CommunityJobsCarousel } from '../../shared/components/community-jobs-carousel/community-jobs-carousel';
@Component({
  selector: 'app-jobs',
  imports: [CommunityJobsCarousel],
  templateUrl: './jobs.html',
})
export class Jobs {}
