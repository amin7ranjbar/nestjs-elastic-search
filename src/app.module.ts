import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Article from './entity/article.entity';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import ArticleController from './controller/article.controller';
import ArticleService from './service/article.service';
import SearchService from './service/search.service';
import * as Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        POSTGRES_HOST: Joi.string().required(),
        POSTGRES_PORT: Joi.number().required(),
        POSTGRES_USER: Joi.string().required(),
        POSTGRES_PASSWORD: Joi.string().required(),
        POSTGRES_DB: Joi.string().required(),
        ELASTICSEARCH_NODE: Joi.string(),
        ELASTICSEARCH_USERNAME: Joi.string(),
        ELASTICSEARCH_PASSWORD: Joi.string(),
        PGADMIN_DEFAULT_EMAIL: Joi.string(),
        PGADMIN_DEFAULT_PASSWORD: Joi.string(),
      }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        logging: ['error'],
        host: configService.get('POSTGRES_HOST'),
        port: configService.get('POSTGRES_PORT'),
        username: configService.get('POSTGRES_USER'),
        password: configService.get('POSTGRES_PASSWORD'),
        database: configService.get('POSTGRES_DB'),
        entities: [Article],
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        node: configService.get('ELASTICSEARCH_NODE'),
        auth: {
          username: configService.get('ELASTICSEARCH_USERNAME'),
          password: configService.get('ELASTICSEARCH_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Article]),
  ],
  controllers: [ArticleController],
  providers: [ArticleService, SearchService],
})
export class AppModule {}
