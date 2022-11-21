import ArticleSearchBody from './article-search-body.interface';

interface ArticleSearchResult {
  hits: {
    total: {
      value: number;
    };
    hits: Array<{
      _source: ArticleSearchBody;
    }>;
  };
}

export default ArticleSearchResult;
