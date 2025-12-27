import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, fromEvent, merge, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

export interface NetworkStatus {
  online: boolean;
  effectiveType?: string; // 'slow-2g', '2g', '3g', '4g'
  downlink?: number; // Mbps
  rtt?: number; // Round trip time in ms
}

@Injectable({
  providedIn: 'root'
})
export class NetworkService implements OnDestroy {
  private statusSubject = new BehaviorSubject<NetworkStatus>(this.getNetworkStatus());
  private offlineBannerShown = false;

  status$ = this.statusSubject.asObservable();
  online$ = this.status$.pipe(
    map(status => status.online),
    distinctUntilChanged()
  );

  private onlineSubscription: any;
  private offlineSubscription: any;

  constructor() {
    this.setupListeners();
  }

  ngOnDestroy(): void {
    if (this.onlineSubscription) {
      this.onlineSubscription.unsubscribe();
    }
    if (this.offlineSubscription) {
      this.offlineSubscription.unsubscribe();
    }
  }

  private setupListeners(): void {
    // Listen to online/offline events
    const online$ = fromEvent(window, 'online');
    const offline$ = fromEvent(window, 'offline');

    merge(online$, offline$).subscribe(() => {
      this.statusSubject.next(this.getNetworkStatus());
    });

    // Listen to Network Information API changes (if available)
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', () => {
        this.statusSubject.next(this.getNetworkStatus());
      });
    }
  }

  private getNetworkStatus(): NetworkStatus {
    const connection = (navigator as any).connection ||
                       (navigator as any).mozConnection ||
                       (navigator as any).webkitConnection;

    const status: NetworkStatus = {
      online: navigator.onLine
    };

    if (connection) {
      status.effectiveType = connection.effectiveType;
      status.downlink = connection.downlink;
      status.rtt = connection.rtt;
    }

    return status;
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Check if connection is slow
   */
  isSlowConnection(): boolean {
    const status = this.statusSubject.value;
    return status.effectiveType === 'slow-2g' ||
           status.effectiveType === '2g' ||
           (status.rtt !== undefined && status.rtt > 500);
  }

  /**
   * Get connection quality description
   */
  getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'offline' {
    const status = this.statusSubject.value;

    if (!status.online) return 'offline';

    if (status.effectiveType) {
      switch (status.effectiveType) {
        case '4g': return status.rtt && status.rtt < 100 ? 'excellent' : 'good';
        case '3g': return 'fair';
        case '2g':
        case 'slow-2g': return 'poor';
        default: return 'good';
      }
    }

    return 'good'; // Default if Network Information API not available
  }

  /**
   * Wait for online status
   */
  waitForOnline(): Observable<boolean> {
    return this.online$.pipe(
      distinctUntilChanged()
    );
  }
}
