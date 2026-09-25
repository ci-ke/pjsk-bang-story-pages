# CI 配置：填写每个仓库的本地路径和 GitHub 仓库名
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generate

REPOS = [
    {'local': './ProjectSekai-story', 'repo': 'ProjectSekai-story'},
    {'local': './BangDream-story', 'repo': 'BangDream-story'},
    {'local': './OurNotes-story', 'repo': 'OurNotes-story'},
]

generate.main(REPOS)
