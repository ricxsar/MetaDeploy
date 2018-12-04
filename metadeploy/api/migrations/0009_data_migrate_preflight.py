# Generated by Django 2.1.2 on 2018-10-16 16:49

from django.db import migrations


def forwards(apps, schema_editor):
    PreflightResult = apps.get_model("api", "PreflightResult")
    PreflightResult.objects.all().delete()


def backwards(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [("api", "0008_preflight_plan_and_status")]

    operations = [migrations.RunPython(forwards, backwards)]
