import React from 'react';
import { Layout, Row, Col } from 'antd';
import ArticleSearch from './ArticleSearch';
import InvoiceSidebar from './InvoiceSidebar';
import { ArticleSearchProvider } from '../../context/ArticleSearchContext';

const { Content } = Layout;

const ArticleSearchPage: React.FC = () => {
  return (
    <ArticleSearchProvider>
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ padding: '24px' }}>
          <Row gutter={[24, 24]}>
            <Col span={18}>
              <ArticleSearch />
            </Col>
            <Col span={6}>
              <InvoiceSidebar />
            </Col>
          </Row>
        </Content>
      </Layout>
    </ArticleSearchProvider>
  );
};

export default ArticleSearchPage;
