import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from "@angular/common/http";
import { Inject, Injectable } from "@angular/core";
import { OKTA_AUTH } from "@okta/okta-angular";
import { OktaAuth } from "@okta/okta-auth-js";
import { from, lastValueFrom, Observable } from "rxjs";
import { environment } from "src/environments/environment";

@Injectable({
  providedIn: "root",
})
export class AuthInterceptorService implements HttpInterceptor {
  constructor(@Inject(OKTA_AUTH) private oktaAuth: OktaAuth) {}
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return from(this.handleAccess(req, next));
  }

  private async handleAccess(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Promise<HttpEvent<any>> {
    const secureEndpoints = [environment.luv2shopApiUrl + "/orders"];

    if (secureEndpoints.some((url) => req.urlWithParams.includes(url))) {
      const accessToken = this.oktaAuth.getAccessToken();

      req = req.clone({
        setHeaders: {
          Authorization: "Bearer " + accessToken,
        },
      });
    }

    return await lastValueFrom(next.handle(req));
  }
}
