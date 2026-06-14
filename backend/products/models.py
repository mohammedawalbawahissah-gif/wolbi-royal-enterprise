from django.db import models


class Product(models.Model):

    class ProductKey(models.TextChoices):
        NEOMATCARE   = "NEOMATCARE",   "NeomatCare"
        FARMASYST    = "FARMASYST",    "FarmaSyst"
        MAGHAZ_ASSIST = "MAGHAZ_ASSIST", "MAGHAZ Assist"
        OTHER        = "OTHER",        "Other"

    class Industry(models.TextChoices):
        HEALTHCARE    = "HEALTHCARE",    "Healthcare"
        AGRICULTURE   = "AGRICULTURE",   "Agriculture"
        REAL_ESTATE   = "REAL_ESTATE",   "Real Estate"
        HOSPITALITY   = "HOSPITALITY",   "Hospitality"
        CONSTRUCTION  = "CONSTRUCTION",  "Construction"
        TECHNOLOGY    = "TECHNOLOGY",    "Technology"
        OTHER         = "OTHER",         "Other"

    name              = models.CharField(max_length=255)
    slug              = models.SlugField(unique=True)
    product_key       = models.CharField(
        max_length=20, choices=ProductKey.choices, default=ProductKey.OTHER
    )
    tagline           = models.CharField(max_length=300, blank=True)
    short_description = models.CharField(max_length=300)
    description       = models.TextField()
    industry          = models.CharField(max_length=20, choices=Industry.choices, blank=True)
    image             = models.ImageField(upload_to="products/", blank=True, null=True)
    featured          = models.BooleanField(default=False)
    active            = models.BooleanField(default=True)
    sort_order        = models.PositiveIntegerField(default=0)
    created_at        = models.DateTimeField(auto_now_add=True)
    updated_at        = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["sort_order", "name"]

    def __str__(self):
        return self.name


class ProductFeature(models.Model):
    product     = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="features")
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    icon        = models.CharField(max_length=100, blank=True)
    sort_order  = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.product.name} — {self.title}"


class ProductRoadmapItem(models.Model):
    product     = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="roadmap_items")
    title       = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    is_complete = models.BooleanField(default=False)
    sort_order  = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order"]

    def __str__(self):
        return f"{self.product.name} — {self.title}"


class ProductTargetUser(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="target_users")
    label   = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.product.name} — {self.label}"
