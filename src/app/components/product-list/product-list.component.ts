import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { CartItem } from "src/app/common/cart-item";
import { Product } from "src/app/common/product";
import { CartService } from "src/app/services/cart.service";
import { ProductService } from "src/app/services/product.service";

@Component({
  selector: "app-product-list",
  templateUrl: "./product-list-grid.component.html",
  styleUrls: ["./product-list.component.css"],
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];

  // we add previousCategoryId because if categoryId changes we have to start pages number one
  currentCategoryId: number = 1;
  previousCategoryId: number = 1;
  searchMode: boolean = false;

  // properties for pagination - first page starts with 1 in ng-bootstrap but 0 in spring
  pageNumber: number = 1;
  pageSize: number = 5;
  totalElements: number = 0;

  previousKeyword: string = "";

  constructor(
    private cartService: CartService,
    private productService: ProductService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(() => {
      this.listProducts();
    });
  }

  listProducts() {
    //keyword kelimesini app.module.ts dosyasında route path'inden alıyor
    this.searchMode = this.route.snapshot.paramMap.has("keyword");

    if (this.searchMode) this.handleSearchProducts();
    else this.handleListProducts();
  }

  handleSearchProducts() {
    const keyword: string = this.route.snapshot.paramMap.get("keyword")!;

    if (this.previousKeyword !== keyword) this.pageNumber = 1;

    this.previousKeyword = keyword;

    // this.productService.searchProducts(keyword).subscribe((data) => {
    //   this.products = data;
    // });

    this.productService
      .searchProductsPaginate(this.pageNumber - 1, this.pageSize, keyword)
      .subscribe(this.processResult);
  }

  handleListProducts() {
    const hasCategoryId: boolean = this.route.snapshot.paramMap.has("id");

    if (hasCategoryId)
      this.currentCategoryId = +this.route.snapshot.paramMap.get("id")!;

    if (this.previousCategoryId !== this.currentCategoryId) this.pageNumber = 1;

    this.previousCategoryId = this.currentCategoryId;

    // this.productService
    //   .getProductList(this.currentCategoryId)
    //   .subscribe((data) => {
    //     this.products = data;
    //   });

    this.productService
      .getProductListPaginate(
        this.pageNumber - 1,
        this.pageSize,
        this.currentCategoryId
      )
      .subscribe(this.processResult());
  }

  addToCart(product: Product) {
    console.log(`Adding to cart: ${product.name}, ${product.unitPrice}`);

    const cartItem = new CartItem(product);

    this.cartService.addToCart(cartItem);
  }

  updatePageSize(selectedPageSize: string) {
    this.pageSize = +selectedPageSize;
    this.pageNumber = 1;
    this.listProducts();
  }

  private processResult() {
    return (data: any) => {
      console.log(data);
      this.products = data._embedded.products;
      this.pageNumber = data.page.number + 1;
      this.pageSize = data.page.size;
      this.totalElements = data.page.totalElements;
    };
  }
}
