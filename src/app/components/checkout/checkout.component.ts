import { Component, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from "@angular/forms";
import { Router } from "@angular/router";
import { Country } from "src/app/common/country";
import { Luv2ShopValidators } from "src/app/common/luv2-shop-validators";
import { Order } from "src/app/common/order";
import { OrderItem } from "src/app/common/order-item";
import { PaymentInfo } from "src/app/common/payment-info";
import { Purchase } from "src/app/common/purchase";
import { State } from "src/app/common/state";
import { CartService } from "src/app/services/cart.service";
import { CheckoutService } from "src/app/services/checkout.service";
import { Luv2ShopFormService } from "src/app/services/luv2-shop-form.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-checkout",
  templateUrl: "./checkout.component.html",
  styleUrls: ["./checkout.component.css"],
})
export class CheckoutComponent implements OnInit {
  checkoutFormGroup!: FormGroup;
  totalPrice: number = 0;
  totalQuantity: number = 0;

  creditCardYears: number[] = [];
  creditCardMonths: number[] = [];

  countries: Country[] = [];
  shippingAddressStates: State[] = [];
  billingAddressStates: State[] = [];

  storage: Storage = sessionStorage;

  stripe = Stripe(environment.stripePublishableKey);

  paymentInfo: PaymentInfo = new PaymentInfo();
  cardElement: any;
  displayError: any;

  isDisabled: boolean = false;

  constructor(
    private formBuilder: FormBuilder,
    private luv2shopFormService: Luv2ShopFormService,
    private cartService: CartService,
    private checkoutService: CheckoutService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const userEmail = JSON.parse(this.storage.getItem("userEmail")!);

    this.setupStripePaymentForm();

    this.checkoutFormGroup = this.formBuilder.group({
      //customer is the key for form
      customer: this.formBuilder.group({
        firstName: new FormControl("", [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhitespace,
        ]),
        lastName: new FormControl("", [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhitespace,
        ]),
        email: new FormControl(userEmail, [
          Validators.required,
          Validators.pattern("^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$"),
        ]),
      }),
      shippingAddress: this.formBuilder.group({
        country: new FormControl("", [Validators.required]),
        street: new FormControl("", [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhitespace,
        ]),
        city: new FormControl("", [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhitespace,
        ]),
        state: new FormControl("", [Validators.required]),
        zipCode: new FormControl("", [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhitespace,
        ]),
      }),
      billingAddress: this.formBuilder.group({
        country: new FormControl("", [Validators.required]),
        street: new FormControl("", [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhitespace,
        ]),
        city: new FormControl("", [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhitespace,
        ]),
        state: new FormControl("", [Validators.required]),
        zipCode: new FormControl("", [
          Validators.required,
          Validators.minLength(2),
          Luv2ShopValidators.notOnlyWhitespace,
        ]),
      }),
      creditCard: this.formBuilder.group({
        // cardType: new FormControl("", [Validators.required]),
        // nameOnCard: new FormControl("", [
        //   Validators.required,
        //   Validators.minLength(2),
        //   Luv2ShopValidators.notOnlyWhitespace,
        // ]),
        // cardNumber: new FormControl("", [
        //   Validators.required,
        //   Validators.pattern("[0-9]{16}"),
        //   Luv2ShopValidators.notOnlyWhitespace,
        // ]),
        // securityCode: new FormControl("", [
        //   Validators.required,
        //   Validators.pattern("[0-9]{3}"),
        //   Luv2ShopValidators.notOnlyWhitespace,
        // ]),
        // expMonth: [""],
        // expYear: [""],
      }),
    });

    // this.luv2shopFormService
    //   .getCreditCardMonths(new Date().getMonth() + 1)
    //   .subscribe((data) => {
    //     this.creditCardMonths = data;
    //   });

    // this.luv2shopFormService.getCreditCardYears().subscribe((data) => {
    //   this.creditCardYears = data;
    // });

    this.luv2shopFormService.getCountries().subscribe((data) => {
      this.countries = data;
    });

    this.reviewCartDetails();
  }

  setupStripePaymentForm() {
    var elements = this.stripe.elements();

    this.cardElement = elements.create("card", { hidePostalCode: true });

    this.cardElement.mount("#card-element");

    this.cardElement.on("change", (event) => {
      this.displayError = document.getElementById("card-errors");

      if (event.complete) this.displayError.textContent = "";
      else if (event.error) this.displayError.textContent = event.error.message;
    });
  }

  get firstName() {
    return this.checkoutFormGroup.get("customer.firstName");
  }

  get lastName() {
    return this.checkoutFormGroup.get("customer.lastName");
  }

  get email() {
    return this.checkoutFormGroup.get("customer.email");
  }

  get shippingAddressStreet() {
    return this.checkoutFormGroup.get("shippingAddress.street");
  }

  get shippingAddressCountry() {
    return this.checkoutFormGroup.get("shippingAddress.country");
  }

  get shippingAddressCity() {
    return this.checkoutFormGroup.get("shippingAddress.city");
  }

  get shippingAddressState() {
    return this.checkoutFormGroup.get("shippingAddress.state");
  }

  get shippingAddressZipCode() {
    return this.checkoutFormGroup.get("shippingAddress.zipCode");
  }

  get billingAddressStreet() {
    return this.checkoutFormGroup.get("billingAddress.street");
  }

  get billingAddressCountry() {
    return this.checkoutFormGroup.get("billingAddress.country");
  }

  get billingAddressCity() {
    return this.checkoutFormGroup.get("billingAddress.city");
  }

  get billingAddressState() {
    return this.checkoutFormGroup.get("billingAddress.state");
  }

  get billingAddressZipCode() {
    return this.checkoutFormGroup.get("billingAddress.zipCode");
  }

  get creditCardType() {
    return this.checkoutFormGroup.get("creditCard.cardType");
  }

  get creditCardNumber() {
    return this.checkoutFormGroup.get("creditCard.cardNumber");
  }

  get creditNameOnCard() {
    return this.checkoutFormGroup.get("creditCard.nameOnCard");
  }

  get creditSecurityCode() {
    return this.checkoutFormGroup.get("creditCard.securityCode");
  }

  onSubmit() {
    console.log("Handling the submit button");

    if (this.checkoutFormGroup.invalid) {
      this.checkoutFormGroup.markAllAsTouched();
      return;
    }

    let order = new Order();
    order.totalPrice = this.totalPrice;
    order.totalQuantity = this.totalQuantity;

    const cartItems = this.cartService.cartItems;

    let orderItems: OrderItem[] = cartItems.map((item) => new OrderItem(item));

    // cartItems.forEach((item) => {
    //   orderItems.push(new OrderItem(item));
    // });

    let purchase = new Purchase();

    purchase.customer = this.checkoutFormGroup.controls["customer"].value;

    purchase.shippingAddress =
      this.checkoutFormGroup.controls["shippingAddress"].value;

    const shippingState: State = JSON.parse(
      JSON.stringify(purchase.shippingAddress.state)
    );

    const shippingCountry: Country = JSON.parse(
      JSON.stringify(purchase.shippingAddress.country)
    );

    purchase.shippingAddress.state = shippingState.name;
    purchase.shippingAddress.country = shippingCountry.name;

    purchase.billingAddress =
      this.checkoutFormGroup.controls["billingAddress"].value;

    const billingState: State = JSON.parse(
      JSON.stringify(purchase.billingAddress.state)
    );

    const billingCountry: Country = JSON.parse(
      JSON.stringify(purchase.billingAddress.country)
    );

    purchase.billingAddress.state = billingState.name;
    purchase.billingAddress.country = billingCountry.name;

    purchase.order = order;
    purchase.orderItems = orderItems;

    this.paymentInfo.amount = Math.round(this.totalPrice * 100);
    this.paymentInfo.currency = "USD";
    this.paymentInfo.receiptEmail = purchase.customer.email;

    if (
      !this.checkoutFormGroup.invalid &&
      this.displayError.textContent === ""
    ) {
      this.isDisabled = true;

      this.checkoutService
        .createPaymentIntent(this.paymentInfo)
        .subscribe((paymentIntentResponse) => {
          this.stripe
            .confirmCardPayment(
              paymentIntentResponse.client_secret,
              {
                payment_method: {
                  card: this.cardElement,
                  billing_details: {
                    email: purchase.customer.email,
                    name: `${purchase.customer.firstName} ${purchase.customer.lastName}`,
                    address: {
                      line1: purchase.billingAddress.street,
                      city: purchase.billingAddress.city,
                      state: purchase.billingAddress.state,
                      postal_code: purchase.billingAddress.zipCode,
                      country: this.billingAddressCountry?.value.code,
                    },
                  },
                },
              },
              { handleActions: false }
            )
            .then(
              function (result) {
                if (result.error) {
                  alert(`There was an error: ${result.error.message}`);
                  this.isDisabled = false;
                } else {
                  this.checkoutService.placeOrder(purchase).subscribe({
                    next: (response) => {
                      alert(
                        `Your order has been received.\nOrder tracking number: ${response.orderTrackingNumber}`
                      );

                      this.resetCart();
                      this.isDisabled = true;
                    },
                    error: (err) => {
                      alert(`There was an error: ${err.message}`);
                    },
                  });
                }
              }.bind(this)
            );
        });
    }
  }

  resetCart() {
    this.cartService.cartItems = [];
    this.cartService.totalPrice.next(0);
    this.cartService.totalQuantity.next(0);
    this.cartService.persistCartItems();

    this.checkoutFormGroup.reset();

    this.router.navigateByUrl("/products");
  }

  copyShippingAddressToBillingAddress(event: any) {
    if (event.target.checked) {
      this.checkoutFormGroup.controls["billingAddress"].setValue(
        this.checkoutFormGroup.controls["shippingAddress"].value
      );

      this.billingAddressStates = this.shippingAddressStates;
    } else {
      this.checkoutFormGroup.controls["billingAddress"].reset();

      this.billingAddressStates = [];
    }
  }

  handleMonthsAndYears() {
    const creditCardFormGroup = this.checkoutFormGroup.get("creditCard");

    const currentYear = new Date().getFullYear();
    const selectedYear = Number(creditCardFormGroup?.value.expYear);

    let startMonth: number;

    if (currentYear === selectedYear) startMonth = new Date().getMonth() + 1;
    else startMonth = 1;

    this.luv2shopFormService
      .getCreditCardMonths(startMonth)
      .subscribe((data) => {
        this.creditCardMonths = data;
      });
  }

  getStates(formGroupName: string) {
    const addressFormGroup = this.checkoutFormGroup.get(formGroupName);

    const countryCode = addressFormGroup?.value.country.code;

    this.luv2shopFormService.getStates(countryCode).subscribe((data) => {
      if (formGroupName.includes("shipping")) this.shippingAddressStates = data;
      else this.billingAddressStates = data;

      //Select first state as default
      addressFormGroup?.get("state")?.setValue(data[0]);
    });
  }

  reviewCartDetails() {
    this.cartService.totalQuantity.subscribe((data) => {
      this.totalQuantity = data;
    });

    this.cartService.totalPrice.subscribe((data) => {
      this.totalPrice = data;
    });
  }
}
