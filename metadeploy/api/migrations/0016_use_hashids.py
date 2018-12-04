# Generated by Django 2.1.2 on 2018-11-07 17:52

import hashid_field.field
from django.db import migrations

alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890"


class Migration(migrations.Migration):

    dependencies = [("api", "0015_merge_20181031_0222")]

    operations = [
        migrations.AlterField(
            model_name="job",
            name="id",
            field=hashid_field.field.HashidAutoField(
                alphabet=alphabet, min_length=7, primary_key=True, serialize=False
            ),
        ),
        migrations.AlterField(
            model_name="plan",
            name="id",
            field=hashid_field.field.HashidAutoField(
                alphabet=alphabet, min_length=7, primary_key=True, serialize=False
            ),
        ),
        migrations.AlterField(
            model_name="product",
            name="id",
            field=hashid_field.field.HashidAutoField(
                alphabet=alphabet, min_length=7, primary_key=True, serialize=False
            ),
        ),
        migrations.AlterField(
            model_name="step",
            name="id",
            field=hashid_field.field.HashidAutoField(
                alphabet=alphabet, min_length=7, primary_key=True, serialize=False
            ),
        ),
        migrations.AlterField(
            model_name="version",
            name="id",
            field=hashid_field.field.HashidAutoField(
                alphabet=alphabet, min_length=7, primary_key=True, serialize=False
            ),
        ),
    ]