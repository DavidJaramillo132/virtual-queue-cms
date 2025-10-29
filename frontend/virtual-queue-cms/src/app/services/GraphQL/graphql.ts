import { APOLLO_OPTIONS } from 'apollo-angular';
import { ApolloClientOptions, InMemoryCache, createHttpLink } from '@apollo/client/core';
import { NgModule } from '@angular/core';

export function createApollo(): ApolloClientOptions {
  return {
    link: createHttpLink({ uri: 'http://localhost:3001/graphql' }),
    cache: new InMemoryCache(),
  } as ApolloClientOptions;
}

@NgModule({
  providers: [
    {
      provide: APOLLO_OPTIONS,
      useFactory: createApollo,
    },
  ],
})
export class GraphQLModule {}
