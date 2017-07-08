import { 
	Component,
	OnInit
}					 		from '@angular/core';
import * as _				from 'lodash';
import { 
	Product
}				 			from '../models';
import { 
	Apollo,
	ApolloQueryObservable
} 							from 'apollo-angular';
import gql 					from 'graphql-tag';
import { Subject } 			from 'rxjs/Subject';
import { Logger	}			from '../utils';
let slugify 				= require('slugify')


// We use the gql tag to parse our query string into a query document
const ProductCatalog = gql`
query ProductCatalog {
	shop{
		products(
			first: 250
			#after: "eyJsYXN0X2lkIjo5ODk1MzIxMjgzLCJsYXN0X3ZhbHVlIjoiOTg5NTMyMTI4MyJ9"
		){
			edges{
				node{
					id
					title
					vendor
					handle
				}
				cursor
			}
			pageInfo{
				hasPreviousPage
				hasNextPage
			}
		}
	}
}
`;



@Component({
	selector: 'brands',
	template: `
		<ul 
			*ngFor="let product of data 
				| async 
				| select: 'shop' 
				| select: 'products' 
				| select: 'edges'
			"
		>
			Product: {{product.node.title}}
		</ul>
	`
})
export class BrandIndexComponent implements OnInit {
	

	// TODO: work out the visibility for these properties
	// - they should all be private , right?
	// - component should provide public accessors
	data: 		ApolloQueryObservable<any>;
	loading: 	boolean;
	products: 	any[];							// TODO: define product model & update type
	brands: 	any;							// TODO: define Brand model & update type



	// constructor
	constructor(
		/*
		private data: 		ApolloQueryObservable<any>,
		private logger: 	Logger,
		private products: 	Array<any>,//Product[],
		private brands: 	_.Dictionary<Product[]>,
		*/
		private client: 	Apollo
	) { };



	ngOnInit() {
		this.init();
	}


	// TODO:
	// - Use RxJS so I only have to query the backend once
	// - will this give me the progressive SPA ux?
	// - see: http://dev.apollodata.com/angular2/queries.html#rxjs
	// - see: http://dev.apollodata.com/angular2/typescript.html
	// TODO:
	// - impl pagination | infinite scroll to reduce round-trip time
	// - this is prolly not as useful in the index view cause I need entire brand catalog
	// - this will be useful in the brand view
	// - see: http://dev.apollodata.com/angular2/pagination.html
	// TODO:
	// - impl logic to update client side cache whenever catalog is updated on backend
	// - see: http://dev.apollodata.com/angular2/receiving-updates.html
	private init() {

		this.data = this.client
			.watchQuery(
				{ 
					query: ProductCatalog 
				}
			)
		;


		this.client
			.watchQuery<any>(
				{
					query: ProductCatalog
				}
			)
			.subscribe(
				({data}) => {
					this.loading 	= data.loading;
					this.products 	= data.shop.products.edges;
					this.brands 	= data.shop.products.edges.reduce(
						// TODO: solve issue with bringing lodash functions to browser
						(b:any,p:any) => {
							let v = slugify(p.node.vendor,'-');
							!!b[v]
							? b[v].push(p)
							: b[v] = [p]

							return b;
						},
						{}
					);
				},
				(err) => { 
					console.log('Fetch error: ' + err.message); 
				},
				() => { 
					this.brands = _.groupBy(
						this.products,
						(p) => {
							slugify(p.node.vendor,'-');
						}
					);
					console.log('Fetch completed!'); 
				}
			)
		;	
	}




	public getProducts(){
		return this.products;
	}




	// TODO: solve issue with bringing lodash functions to browser
	public getProduct(id: string) {
		return 	_.find(this.products,(p)=>p.id);
	}




	public getBrands(){
		return this.brands;
	}




	public getBrand(vendor: string){
		return this.brands[vendor];
	}

}








