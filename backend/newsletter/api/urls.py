from django.urls import path
from .views import SubscribeView, UnsubscribeView, SubscriberListView, NewsletterAIDraftView

urlpatterns = [
    path("subscribe/",   SubscribeView.as_view(),    name="newsletter-subscribe"),
    path("unsubscribe/", UnsubscribeView.as_view(),  name="newsletter-unsubscribe"),
    path("subscribers/", SubscriberListView.as_view(), name="newsletter-subscribers"),
    path("ai-draft/",    NewsletterAIDraftView.as_view(), name="newsletter-ai-draft"),
]
