from __future__ import annotations

from pathlib import Path

from tehillim_pipeline.cli import (
    DEFAULT_CLUSTER_OUTPUT,
    DEFAULT_GUNKEL_OUTPUT,
    DEFAULT_OUTPUT,
    parse_args,
)


def test_parse_args_defaults_bhsa_path_to_none_without_env(monkeypatch):
    monkeypatch.delenv("TEHILLIM_BHSA_PATH", raising=False)
    args = parse_args([])
    assert args.bhsa_path is None
    assert args.output == DEFAULT_OUTPUT


def test_parse_args_reads_bhsa_path_from_env(monkeypatch):
    monkeypatch.setenv("TEHILLIM_BHSA_PATH", "/some/custom/path")
    args = parse_args([])
    assert args.bhsa_path == Path("/some/custom/path")


def test_parse_args_explicit_flags_override_env(monkeypatch):
    monkeypatch.setenv("TEHILLIM_BHSA_PATH", "/env/path")
    args = parse_args(["--bhsa-path", "/flag/path", "--output", "/tmp/out.json"])
    assert args.bhsa_path == Path("/flag/path")
    assert args.output == Path("/tmp/out.json")


def test_parse_args_defaults_valence_path_to_none_without_env(monkeypatch):
    monkeypatch.delenv("TEHILLIM_VALENCE_PATH", raising=False)
    args = parse_args([])
    assert args.valence_path is None


def test_parse_args_reads_valence_path_from_env(monkeypatch):
    monkeypatch.setenv("TEHILLIM_VALENCE_PATH", "/some/valence/path")
    args = parse_args([])
    assert args.valence_path == Path("/some/valence/path")


def test_parse_args_explicit_valence_flag_overrides_env(monkeypatch):
    monkeypatch.setenv("TEHILLIM_VALENCE_PATH", "/env/path")
    args = parse_args(["--valence-path", "/flag/path"])
    assert args.valence_path == Path("/flag/path")


def test_default_output_path_points_into_app_public_data():
    assert DEFAULT_OUTPUT.parent.parts[-3:] == ("app", "public", "data")
    assert DEFAULT_OUTPUT.name == "similarity.json"


def test_parse_args_defaults_cluster_output_path():
    args = parse_args([])
    assert args.cluster_output == DEFAULT_CLUSTER_OUTPUT


def test_parse_args_explicit_cluster_output_flag():
    args = parse_args(["--cluster-output", "/tmp/clusters.json"])
    assert args.cluster_output == Path("/tmp/clusters.json")


def test_default_cluster_output_path_points_into_app_public_data():
    assert DEFAULT_CLUSTER_OUTPUT.parent.parts[-3:] == ("app", "public", "data")
    assert DEFAULT_CLUSTER_OUTPUT.name == "clustering.json"


def test_parse_args_defaults_gunkel_output_path():
    args = parse_args([])
    assert args.gunkel_output == DEFAULT_GUNKEL_OUTPUT


def test_parse_args_explicit_gunkel_output_flag():
    args = parse_args(["--gunkel-output", "/tmp/gunkel.json"])
    assert args.gunkel_output == Path("/tmp/gunkel.json")


def test_default_gunkel_output_path_points_into_app_public_data():
    assert DEFAULT_GUNKEL_OUTPUT.parent.parts[-3:] == ("app", "public", "data")
    assert DEFAULT_GUNKEL_OUTPUT.name == "gunkel.json"
