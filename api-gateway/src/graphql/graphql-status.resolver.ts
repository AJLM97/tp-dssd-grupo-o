import { Query, Resolver } from '@nestjs/graphql';

@Resolver()
export class GraphqlStatusResolver {
  @Query(() => String, {
    name: 'estadoGraphql',
    description: 'Comprueba que el endpoint GraphQL se encuentra operativo.',
  })
  estadoGraphql(): string {
    return 'GraphQL operativo';
  }
}
