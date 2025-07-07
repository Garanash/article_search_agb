"""Create email campaigns tables

Revision ID: 004
Revises: 003
Create Date: 2025-01-27 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '004'
down_revision = '003'
branch_labels = None
depends_on = None


def upgrade():
    # Создаем таблицу email кампаний
    op.create_table('email_campaigns',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('supplier_email', sa.String(length=255), nullable=False),
        sa.Column('supplier_name', sa.String(length=255), nullable=False),
        sa.Column('supplier_website', sa.String(length=255), nullable=True),
        sa.Column('supplier_country', sa.String(length=100), nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, default='draft'),
        sa.Column('subject', sa.Text(), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('last_reply_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Создаем таблицу артикулов в кампаниях
    op.create_table('email_campaign_articles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('campaign_id', sa.Integer(), nullable=False),
        sa.Column('article_id', sa.Integer(), nullable=False),
        sa.Column('request_id', sa.Integer(), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False, default=1),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['campaign_id'], ['email_campaigns.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['article_id'], ['articles.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['request_id'], ['requests.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Создаем таблицу сообщений кампаний
    op.create_table('email_messages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('campaign_id', sa.Integer(), nullable=False),
        sa.Column('message_type', sa.String(length=50), nullable=False),  # sent, received
        sa.Column('subject', sa.String(length=500), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('from_email', sa.String(length=255), nullable=False),
        sa.Column('to_email', sa.String(length=255), nullable=False),
        sa.Column('external_id', sa.String(length=255), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.Column('read_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['campaign_id'], ['email_campaigns.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Создаем таблицу вложений к сообщениям
    op.create_table('email_attachments',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('message_id', sa.Integer(), nullable=False),
        sa.Column('filename', sa.String(length=255), nullable=False),
        sa.Column('file_path', sa.String(length=500), nullable=False),
        sa.Column('file_size', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['message_id'], ['email_messages.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # Создаем индексы для оптимизации
    op.create_index('idx_email_campaigns_user_id', 'email_campaigns', ['user_id'])
    op.create_index('idx_email_campaigns_status', 'email_campaigns', ['status'])
    op.create_index('idx_email_campaigns_supplier_email', 'email_campaigns', ['supplier_email'])
    op.create_index('idx_email_campaign_articles_campaign_id', 'email_campaign_articles', ['campaign_id'])
    op.create_index('idx_email_campaign_articles_article_id', 'email_campaign_articles', ['article_id'])
    op.create_index('idx_email_messages_campaign_id', 'email_messages', ['campaign_id'])
    op.create_index('idx_email_messages_message_type', 'email_messages', ['message_type'])
    op.create_index('idx_email_attachments_message_id', 'email_attachments', ['message_id'])


def downgrade():
    # Удаляем индексы
    op.drop_index('idx_email_attachments_message_id', 'email_attachments')
    op.drop_index('idx_email_messages_message_type', 'email_messages')
    op.drop_index('idx_email_messages_campaign_id', 'email_messages')
    op.drop_index('idx_email_campaign_articles_article_id', 'email_campaign_articles')
    op.drop_index('idx_email_campaign_articles_campaign_id', 'email_campaign_articles')
    op.drop_index('idx_email_campaigns_supplier_email', 'email_campaigns')
    op.drop_index('idx_email_campaigns_status', 'email_campaigns')
    op.drop_index('idx_email_campaigns_user_id', 'email_campaigns')

    # Удаляем таблицы
    op.drop_table('email_attachments')
    op.drop_table('email_messages')
    op.drop_table('email_campaign_articles')
    op.drop_table('email_campaigns') 