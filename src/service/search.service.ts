import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import Article from '../entity/article.entity';
import ArticleCountResult from '../interface/article-count-result.interface';
import ArticleSearchBody from '../interface/article-search-body.interface';
import ArticleSearchResult from '../interface/article-search-result.interface';

@Injectable()
export default class SearchService {
  index = 'articles';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async indexArticle(article: Article) {
    return this.elasticsearchService.index<
      ArticleSearchResult,
      ArticleSearchBody
    >({
      index: this.index,
      body: {
        id: article.id,
        title: article.title,
        content: article.content,
      },
    });
  }

  async count(query: string, fields: string[]) {
    const { body } = await this.elasticsearchService.count<ArticleCountResult>({
      index: this.index,
      body: {
        query: {
          multi_match: {
            query,
            fields,
          },
        },
      },
    });
    return body.count;
  }

  async search(text: string, offset?: number, limit?: number, startId = 0) {
    let separateCount = 0;
    if (startId) {
      separateCount = await this.count(text, ['title', 'paragraphs']);
    }
    const { body } =
      await this.elasticsearchService.search<ArticleSearchResult>({
        index: this.index,
        from: offset,
        size: limit,
        body: {
          query: {
            bool: {
              should: {
                multi_match: {
                  query: text,
                  fields: ['title', 'paragraphs'],
                },
              },
              filter: {
                range: {
                  id: {
                    gt: startId,
                  },
                },
              },
            },
          },
          sort: {
            id: {
              order: 'asc',
            },
          },
        },
      });
    const count = body.hits.total.value;
    const hits = body.hits.hits;
    const results = hits.map((item) => item._source);
    return {
      count: startId ? separateCount : count,
      results,
    };
  }

  async remove(articleId: number) {
    this.elasticsearchService.deleteByQuery({
      index: this.index,
      body: {
        query: {
          match: {
            id: articleId,
          },
        },
      },
    });
  }

  async update(article: Article) {
    const newBody: ArticleSearchBody = {
      id: article.id,
      title: article.title,
      content: article.content,
    };

    const script = Object.entries(newBody).reduce((result, [key, value]) => {
      return `${result} ctx._source.${key}='${value}';`;
    }, '');

    return this.elasticsearchService.updateByQuery({
      index: this.index,
      body: {
        query: {
          match: {
            id: article.id,
          },
        },
        script: {
          inline: script,
        },
      },
    });
  }
}
