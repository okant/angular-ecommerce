import { Injectable } from "@angular/core";
import { BehaviorSubject, Subject } from "rxjs";
import { CartItem } from "../common/cart-item";

@Injectable({
  providedIn: "root",
})
export class CartService {
  cartItems: CartItem[] = [];

  //Subject is a subclass of Observable.
  //With this, price and quantity events will be published and events will be sent to all of the subscribers

  totalPrice: Subject<number> = new BehaviorSubject<number>(0);
  totalQuantity: Subject<number> = new BehaviorSubject<number>(0);

  storage: Storage = sessionStorage;

  constructor() {
    let data = JSON.parse(this.storage.getItem("cartItems")!);

    if (data != null) {
      this.cartItems = data;
      this.computeCartTotals();
    }
  }

  addToCart(cartItem: CartItem) {
    let existsInCart: boolean = false;
    let existingCartItem!: CartItem;

    if (this.cartItems.length > 0) {
      existingCartItem = this.cartItems.find((f) => f.id === cartItem.id)!;

      existsInCart = existingCartItem != undefined;
    }

    if (existsInCart) existingCartItem.quantity++;
    else this.cartItems.push(cartItem);

    this.computeCartTotals();
  }

  computeCartTotals() {
    let totalPriceValue: number = 0;
    let totalQuantityValue: number = 0;

    this.cartItems.forEach((item) => {
      totalPriceValue += item.quantity * item.unitPrice;
      totalQuantityValue += item.quantity;
    });

    //With next subscribing is starting
    this.totalPrice.next(totalPriceValue);
    this.totalQuantity.next(totalQuantityValue);

    this.logCartData(totalPriceValue, totalQuantityValue);

    this.persistCartItems();
  }

  logCartData(totalPriceValue: number, totalQuantityValue: number) {
    console.log("Contents of the cart");

    for (let item of this.cartItems) {
      const subTotalPrice = item.quantity * item.unitPrice;
      console.log(
        `name: ${item.name}, quantity=${item.quantity}, unitPrice=${item.unitPrice}, subTotalPrice=${subTotalPrice}`
      );
    }

    console.log(
      `totalPrice: ${totalPriceValue.toFixed(
        2
      )}, totalQuantity: ${totalQuantityValue}`
    );
    console.log("------");
  }

  decrementQuantity(cartItem: CartItem) {
    cartItem.quantity--;

    if (cartItem.quantity === 0) this.remove(cartItem);
    else this.computeCartTotals();
  }

  remove(cartItem: CartItem) {
    const idx = this.cartItems.indexOf(cartItem);

    console.log(`Index of item: ${idx}`);

    //this.cartItems.findIndex((f) => f.id === cartItem.id);

    if (idx > -1) {
      this.cartItems.splice(idx, 1);
      this.computeCartTotals();
    }
  }

  persistCartItems() {
    this.storage.setItem("cartItems", JSON.stringify(this.cartItems));
  }
}
